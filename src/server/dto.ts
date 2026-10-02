import type { Prisma } from '@prisma/client';

export const apartmentInclude = {
  building: { select: { buildingNumber: true } },
  residents: { include: { user: true } },
  vehicles: { orderBy: { createdAt: 'asc' } },
  garageSpots: { orderBy: { spotNumber: 'asc' } },
  subscriptions: {
    include: {
      service: true,
      charges: { where: { isPaid: false }, orderBy: { period: 'asc' } },
    },
  },
  installments: { orderBy: { sequenceNumber: 'asc' } },
} satisfies Prisma.ApartmentInclude;

type ApartmentRow = Prisma.ApartmentGetPayload<{ include: typeof apartmentInclude }>;

const num = (d: Prisma.Decimal | null | undefined) => (d == null ? null : Number(d));

export function toApartmentDto(a: ApartmentRow) {
  const owner = a.residents.find((r) => r.isContractOwner) ?? a.residents[0];
  const installments = a.installments.map((i) => ({
    id: i.id,
    apartmentId: i.apartmentId,
    sequenceNumber: i.sequenceNumber,
    dueDate: i.dueDate.toISOString().slice(0, 10),
    amount: Number(i.amount),
    isPaid: i.isPaid,
    paidAt: i.paidAt?.toISOString().slice(0, 10),
  }));
  const unpaidCharges = a.subscriptions.flatMap((s) =>
    s.charges.map((c) => ({
      id: c.id,
      period: c.period,
      amount: Number(c.amount),
      serviceName: s.service.name,
    })),
  );
  const now = new Date();
  return {
    id: a.id,
    buildingId: a.buildingId,
    buildingNumber: a.building.buildingNumber,
    floorNumber: a.floorNumber,
    apartmentNumber: a.apartmentNumber,
    sequentialCode: a.sequentialCode,
    isSold: a.isSold,
    price: Number(a.price),
    paymentType: a.paymentType ?? undefined,
    downPayment: num(a.downPayment),
    installmentMonths: a.installmentMonths,
    occupancyStatus: a.occupancyStatus,
    isOccupied: a.isOccupied,
    contractOwner: owner
      ? {
          id: owner.id,
          userId: owner.userId,
          fullName: owner.user.fullName,
          email: owner.user.email,
          phone: owner.user.phone ?? '',
          gender: owner.user.gender ?? '',
          avatarUrl: owner.user.avatarUrl ?? undefined,
          isContractOwner: owner.isContractOwner,
          hasAccessBadge: owner.hasAccessBadge,
          badgeCode: owner.badgeCode ?? undefined,
          familyMembersCount: owner.familyMembersCount,
        }
      : undefined,
    vehicles: a.vehicles.map((v) => ({
      id: v.id,
      apartmentId: v.apartmentId,
      plateNumber: v.plateNumber,
      makeModel: v.makeModel,
      color: v.color ?? undefined,
      rfidBadgeCode: v.rfidBadgeCode ?? undefined,
    })),
    garageSpots: a.garageSpots.map((g) => ({
      id: g.id,
      apartmentId: g.apartmentId ?? undefined,
      spotNumber: g.spotNumber,
      zoneFloor: g.zoneFloor,
      accessBarcode: g.accessBarcode ?? undefined,
      isOccupied: g.isOccupied,
    })),
    subscriptions: a.subscriptions
      .filter((s) => s.isActive)
      .map((s) => ({
        id: s.id,
        apartmentId: s.apartmentId,
        serviceId: s.serviceId,
        serviceName: s.service.name,
        monthlyPrice: Number(s.service.monthlyPrice),
        startDate: s.startDate.toISOString().slice(0, 10),
        isActive: s.isActive,
      })),
    installments,
    unpaidCharges,
    financials: {
      paidInstallments: installments.filter((i) => i.isPaid).reduce((t, i) => t + i.amount, 0),
      remainingInstallments: installments.filter((i) => !i.isPaid).reduce((t, i) => t + i.amount, 0),
      overdueInstallments: a.installments.filter((i) => !i.isPaid && i.dueDate < now).length,
      nextDueDate: installments.find((i) => !i.isPaid)?.dueDate ?? null,
      unpaidChargesTotal: unpaidCharges.reduce((t, c) => t + c.amount, 0),
    },
  };
}

export type ApartmentDto = ReturnType<typeof toApartmentDto>;
