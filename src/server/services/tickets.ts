import type { Prisma, TicketStatus } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../db';
import { type Actor, assertApartmentAccess, isManagement } from '../auth';
import { badRequest, forbidden, notFound } from '../errors';
import type { ticketSchema } from '../validation';
import { audit } from './audit';

const include = {
  apartment: { select: { sequentialCode: true } },
  worker: { include: { user: { select: { fullName: true } } } },
} satisfies Prisma.MaintenanceTicketInclude;

type Row = Prisma.MaintenanceTicketGetPayload<{ include: typeof include }>;

const toDto = (t: Row) => ({
  id: t.id,
  apartmentId: t.apartmentId,
  apartmentCode: t.apartment.sequentialCode,
  title: t.title,
  description: t.description,
  status: t.status,
  workerName: t.worker?.user.fullName,
  createdAt: t.createdAt.toISOString(),
});

export async function listTickets(actor: Actor) {
  let where: Prisma.MaintenanceTicketWhereInput = {};
  if (actor.role === 'RESIDENT') {
    if (!actor.apartmentId) return [];
    where = { apartmentId: actor.apartmentId };
  } else if (actor.role === 'MAINTENANCE_WORKER') {
    where = { OR: [{ workerId: null }, { workerId: actor.workerProfileId }] };
  }
  const rows = await prisma.maintenanceTicket.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map(toDto);
}

export async function createTicket(actor: Actor, input: z.infer<typeof ticketSchema>) {
  const apartmentId = actor.role === 'RESIDENT' ? actor.apartmentId : input.apartmentId;
  if (!apartmentId) throw badRequest('يجب تحديد الشقة');
  assertApartmentAccess(actor, apartmentId);
  const t = await prisma.$transaction(async (tx) => {
    const row = await tx.maintenanceTicket.create({
      data: { apartmentId, title: input.title, description: input.description, createdById: actor.id },
      include,
    });
    await audit(tx, actor.id, 'TICKET_CREATED', 'MaintenanceTicket', row.id);
    return row;
  });
  return toDto(t);
}

const WORKER_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [],
  CANCELLED: [],
};

export async function updateTicketStatus(actor: Actor, ticketId: string, status: TicketStatus) {
  const t = await prisma.maintenanceTicket.findUnique({ where: { id: ticketId } });
  if (!t) throw notFound('البلاغ');

  let workerId = t.workerId;
  if (actor.role === 'MAINTENANCE_WORKER') {
    if (t.workerId && t.workerId !== actor.workerProfileId) throw forbidden();
    if (!WORKER_TRANSITIONS[t.status].includes(status)) throw badRequest('انتقال حالة غير مسموح');
    workerId = actor.workerProfileId; // the worker who picks a ticket up owns it
  } else if (actor.role === 'RESIDENT') {
    // Residents may only cancel their own pending tickets.
    assertApartmentAccess(actor, t.apartmentId);
    if (status !== 'CANCELLED' || t.status !== 'PENDING') throw forbidden();
  } else if (!isManagement(actor)) {
    throw forbidden();
  }

  const row = await prisma.$transaction(async (tx) => {
    const r = await tx.maintenanceTicket.update({ where: { id: ticketId }, data: { status, workerId }, include });
    await audit(tx, actor.id, 'TICKET_STATUS', 'MaintenanceTicket', ticketId, { from: t.status, to: status });
    return r;
  });
  return toDto(row);
}
