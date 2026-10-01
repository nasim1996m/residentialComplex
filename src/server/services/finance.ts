import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { type Actor, isManagement } from '../auth';
import { conflict, forbidden, notFound } from '../errors';
import { audit } from './audit';

export async function payInstallment(actor: Actor, installmentId: string) {
  if (!isManagement(actor)) throw forbidden();
  return prisma.$transaction(async (tx) => {
    const inst = await tx.installment.findUnique({ where: { id: installmentId } });
    if (!inst) throw notFound('القسط');
    const now = new Date();
    // Only flips unpaid -> paid once, even under concurrent requests.
    const res = await tx.installment.updateMany({ where: { id: inst.id, isPaid: false }, data: { isPaid: true, paidAt: now } });
    if (res.count === 0) throw conflict('هذا القسط مدفوع مسبقاً');
    await tx.payment.create({
      data: {
        kind: 'INSTALLMENT',
        apartmentId: inst.apartmentId,
        installmentId: inst.id,
        amount: inst.amount,
        paymentDate: now,
        recordedById: actor.id,
        notes: `القسط رقم ${inst.sequenceNumber}`,
      },
    });
    await audit(tx, actor.id, 'INSTALLMENT_PAID', 'Installment', inst.id, { amount: inst.amount.toString() });
    return { apartmentId: inst.apartmentId };
  });
}

// Bills every active subscription of an occupied apartment for `period`. Safe to re-run.
export async function generateMonthlyCharges(actor: Actor, period: string) {
  if (!isManagement(actor)) throw forbidden();
  const subs = await prisma.subscription.findMany({
    where: { isActive: true, apartment: { isOccupied: true }, service: { isAvailable: true } },
    include: { service: true },
  });
  const res = await prisma.subscriptionCharge.createMany({
    data: subs.map((s) => ({ subscriptionId: s.id, period, amount: s.service.monthlyPrice })),
    skipDuplicates: true,
  });
  await audit(prisma, actor.id, 'CHARGES_GENERATED', 'SubscriptionCharge', null, { period, created: res.count });
  return { period, created: res.count, eligibleSubscriptions: subs.length };
}

export async function payCharge(actor: Actor, chargeId: string) {
  if (!isManagement(actor)) throw forbidden();
  return prisma.$transaction(async (tx) => {
    const charge = await tx.subscriptionCharge.findUnique({ where: { id: chargeId }, include: { subscription: true } });
    if (!charge) throw notFound('الفاتورة');
    const now = new Date();
    const res = await tx.subscriptionCharge.updateMany({
      where: { id: charge.id, isPaid: false },
      data: { isPaid: true, paidAt: now },
    });
    if (res.count === 0) throw conflict('هذه الفاتورة مدفوعة مسبقاً');
    await tx.payment.create({
      data: {
        kind: 'SUBSCRIPTION',
        apartmentId: charge.subscription.apartmentId,
        chargeId: charge.id,
        amount: charge.amount,
        paymentDate: now,
        recordedById: actor.id,
        notes: `اشتراك ${charge.period}`,
      },
    });
    await audit(tx, actor.id, 'CHARGE_PAID', 'SubscriptionCharge', charge.id, { amount: charge.amount.toString() });
    return { apartmentId: charge.subscription.apartmentId };
  });
}

const n = (d: Prisma.Decimal | null) => Number(d ?? 0);

export async function financialSummary(actor: Actor) {
  if (!isManagement(actor)) throw forbidden();
  const now = new Date();
  const [sales, collectedByKind, unpaidInst, overdueInst, unpaidCharges, paidCharges] = await Promise.all([
    prisma.apartment.aggregate({ where: { isSold: true }, _sum: { price: true }, _count: true }),
    prisma.payment.groupBy({ by: ['kind'], _sum: { amount: true }, _count: true }),
    prisma.installment.aggregate({ where: { isPaid: false }, _sum: { amount: true }, _count: true }),
    prisma.installment.aggregate({ where: { isPaid: false, dueDate: { lt: now } }, _sum: { amount: true }, _count: true }),
    prisma.subscriptionCharge.aggregate({ where: { isPaid: false }, _sum: { amount: true }, _count: true }),
    prisma.subscriptionCharge.aggregate({ where: { isPaid: true }, _sum: { amount: true }, _count: true }),
  ]);
  const collected = Object.fromEntries(collectedByKind.map((g) => [g.kind, { amount: n(g._sum.amount), count: g._count }]));
  return {
    soldApartments: sales._count,
    totalSalesValue: n(sales._sum.price),
    collected,
    totalCollected: collectedByKind.reduce((t, g) => t + n(g._sum.amount), 0),
    outstandingInstallments: { amount: n(unpaidInst._sum.amount), count: unpaidInst._count },
    overdueInstallments: { amount: n(overdueInst._sum.amount), count: overdueInst._count },
    unpaidSubscriptionCharges: { amount: n(unpaidCharges._sum.amount), count: unpaidCharges._count },
    paidSubscriptionCharges: { amount: n(paidCharges._sum.amount), count: paidCharges._count },
  };
}
