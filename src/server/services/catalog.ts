import type { z } from 'zod';
import { prisma } from '../db';
import type { Actor } from '../auth';
import { forbidden } from '../errors';
import type { serviceUpdateSchema } from '../validation';
import { audit } from './audit';

export async function listServices() {
  const services = await prisma.service.findMany({
    orderBy: { code: 'asc' },
    include: { _count: { select: { subscriptions: { where: { isActive: true } } } } },
  });
  return services.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    monthlyPrice: Number(s.monthlyPrice),
    isAvailable: s.isAvailable,
    isDefault: s.isDefault,
    subscribedCount: s._count.subscriptions,
  }));
}

export async function updateService(actor: Actor, id: string, input: z.infer<typeof serviceUpdateSchema>) {
  if (actor.role !== 'SUPER_ADMIN') throw forbidden();
  await prisma.$transaction(async (tx) => {
    const s = await tx.service.update({ where: { id }, data: input });
    await audit(tx, actor.id, 'SERVICE_UPDATED', 'Service', s.id, input);
  });
}
