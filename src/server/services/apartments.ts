import { Prisma, type OccupancyStatus } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../db';
import { type Actor, assertApartmentAccess, isManagement } from '../auth';
import { badRequest, conflict, forbidden, notFound } from '../errors';
import { apartmentInclude, toApartmentDto } from '../dto';
import { generateCode, generateTemporaryPassword, hashPassword } from '../password';
import type { saleSchema } from '../validation';
import { audit } from './audit';

type Tx = Prisma.TransactionClient;

export const isOccupiedStatus = (s: OccupancyStatus) => s === 'OWNER_OCCUPIED' || s === 'RENTED';

export async function listBuildings(actor: Actor) {
  if (!isManagement(actor)) throw forbidden();
  const buildings = await prisma.building.findMany({
    orderBy: { buildingNumber: 'asc' },
    include: {
      apartments: {
        include: apartmentInclude,
        orderBy: [{ floorNumber: 'asc' }, { apartmentNumber: 'asc' }],
      },
    },
  });
  return buildings.map(({ apartments, ...b }) => ({ ...b, apartments: apartments.map(toApartmentDto) }));
}

export async function getApartment(actor: Actor, apartmentId: string) {
  assertApartmentAccess(actor, apartmentId);
  const apt = await prisma.apartment.findUnique({ where: { id: apartmentId }, include: apartmentInclude });
  if (!apt) throw notFound('الشقة');
  return toApartmentDto(apt);
}

// Splits `total` into `months` installments in whole cents; the last one absorbs the remainder.
export function buildInstallmentSchedule(total: Prisma.Decimal, months: number, firstDue: Date) {
  const totalCents = total.mul(100).toDecimalPlaces(0).toNumber();
  const baseCents = Math.floor(totalCents / months);
  return Array.from({ length: months }, (_, i) => {
    const cents = i === months - 1 ? totalCents - baseCents * (months - 1) : baseCents;
    const due = new Date(Date.UTC(firstDue.getUTCFullYear(), firstDue.getUTCMonth() + i, firstDue.getUTCDate()));
    return { sequenceNumber: i + 1, amount: new Prisma.Decimal(cents).div(100), dueDate: due };
  });
}

// Activates default services on occupancy and pauses every subscription when the apartment is vacant.
async function syncSubscriptions(tx: Tx, apartmentId: string, occupied: boolean) {
  if (!occupied) {
    await tx.subscription.updateMany({
      where: { apartmentId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });
    return;
  }
  const services = await tx.service.findMany({ where: { isDefault: true, isAvailable: true } });
  for (const s of services) {
    await tx.subscription.upsert({
      where: { apartmentId_serviceId: { apartmentId, serviceId: s.id } },
      create: { apartmentId, serviceId: s.id },
      update: { isActive: true, endDate: null },
    });
  }
}

export async function registerSale(actor: Actor, input: z.infer<typeof saleSchema>) {
  if (actor.role !== 'SUPER_ADMIN') throw forbidden();

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const result = await prisma.$transaction(async (tx) => {
    const apt = await tx.apartment.findUnique({ where: { id: input.apartmentId }, include: { building: true } });
    if (!apt) throw notFound('الشقة');
    if (apt.building.status !== 'COMPLETED') throw badRequest('لا يمكن بيع شقة في بناية قيد الإنشاء');

    const price = new Prisma.Decimal(input.price ?? apt.price);
    const down = new Prisma.Decimal(input.paymentType === 'INSTALLMENTS' ? input.downPayment ?? 0 : 0);
    if (down.gte(price)) throw badRequest('الدفعة المقدمة يجب أن تكون أقل من سعر الشقة');

    const occupied = isOccupiedStatus(input.occupancyStatus);
    // Conditional update guards against two concurrent sales of the same apartment.
    const claimed = await tx.apartment.updateMany({
      where: { id: apt.id, isSold: false },
      data: {
        isSold: true,
        soldAt: new Date(),
        price,
        paymentType: input.paymentType,
        downPayment: input.paymentType === 'INSTALLMENTS' ? down : null,
        installmentMonths: input.paymentType === 'INSTALLMENTS' ? input.installmentMonths : null,
        occupancyStatus: input.occupancyStatus,
        isOccupied: occupied,
      },
    });
    if (claimed.count === 0) throw conflict('هذه الشقة مباعة مسبقاً');

    const existing = await tx.user.findUnique({ where: { email: input.buyer.email }, include: { residentProfile: true } });
    if (existing) throw conflict('البريد الإلكتروني مسجل لمستخدم آخر');

    const user = await tx.user.create({
      data: {
        email: input.buyer.email,
        fullName: input.buyer.fullName,
        phone: input.buyer.phone,
        gender: input.buyer.gender,
        role: 'RESIDENT',
        passwordHash,
        residentProfile: {
          create: {
            apartmentId: apt.id,
            isContractOwner: true,
            hasAccessBadge: true,
            badgeCode: generateCode('RFID-PASS'),
            familyMembersCount: input.buyer.familyMembersCount,
          },
        },
      },
    });

    if (input.paymentType === 'FULL_CASH') {
      await tx.payment.create({
        data: { kind: 'FULL_CASH', apartmentId: apt.id, amount: price, recordedById: actor.id, notes: 'دفعة كاملة' },
      });
    } else {
      if (down.gt(0)) {
        await tx.payment.create({
          data: { kind: 'DOWN_PAYMENT', apartmentId: apt.id, amount: down, recordedById: actor.id, notes: 'دفعة مقدمة' },
        });
      }
      const first = input.firstDueDate
        ? new Date(`${input.firstDueDate}T00:00:00Z`)
        : (() => {
            const n = new Date();
            return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1));
          })();
      const schedule = buildInstallmentSchedule(price.sub(down), input.installmentMonths!, first);
      await tx.installment.createMany({ data: schedule.map((s) => ({ ...s, apartmentId: apt.id })) });
    }

    await syncSubscriptions(tx, apt.id, occupied);
    await audit(tx, actor.id, 'SALE_REGISTERED', 'Apartment', apt.id, {
      buyerUserId: user.id,
      paymentType: input.paymentType,
      price: price.toString(),
    });

    return { apartmentId: apt.id, email: user.email };
  });

  return { apartment: await getApartment(actor, result.apartmentId), credentials: { email: result.email, temporaryPassword } };
}

export async function setOccupancy(actor: Actor, apartmentId: string, status: OccupancyStatus) {
  if (!isManagement(actor)) throw forbidden();
  await prisma.$transaction(async (tx) => {
    const apt = await tx.apartment.findUnique({ where: { id: apartmentId } });
    if (!apt) throw notFound('الشقة');
    if (!apt.isSold && status !== 'VACANT_UNSOLD') throw badRequest('يجب تسجيل بيع الشقة قبل تغيير حالة السكن');
    if (apt.isSold && status === 'VACANT_UNSOLD') throw badRequest('لا يمكن جعل شقة مباعة "غير مباعة"');

    const occupied = isOccupiedStatus(status);
    await tx.apartment.update({ where: { id: apartmentId }, data: { occupancyStatus: status, isOccupied: occupied } });
    await syncSubscriptions(tx, apartmentId, occupied);
    await audit(tx, actor.id, 'OCCUPANCY_CHANGED', 'Apartment', apartmentId, { from: apt.occupancyStatus, to: status });
  });
  return getApartment(actor, apartmentId);
}
