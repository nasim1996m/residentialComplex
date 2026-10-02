import type { z } from 'zod';
import { prisma } from '../db';
import { type Actor, isManagement } from '../auth';
import { conflict, forbidden, notFound } from '../errors';
import { generateTemporaryPassword, hashPassword } from '../password';
import type { staffSchema } from '../validation';
import { audit } from './audit';

export async function listStaff(actor: Actor) {
  if (!isManagement(actor)) throw forbidden();
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN_STAFF', 'MAINTENANCE_WORKER'] }, isActive: true },
    include: { staffProfile: true, workerProfile: true },
    orderBy: { createdAt: 'asc' },
  });
  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone ?? '',
    gender: u.gender ?? '',
    avatarUrl: u.avatarUrl ?? undefined,
    role: u.role,
    department: u.staffProfile?.department ?? u.workerProfile?.specialization ?? '',
    isOnDuty: u.staffProfile?.isOnDuty ?? u.workerProfile?.isAvailable ?? false,
  }));
}

export async function createStaff(actor: Actor, input: z.infer<typeof staffSchema>) {
  if (actor.role !== 'SUPER_ADMIN') throw forbidden();
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('البريد الإلكتروني مسجل مسبقاً');
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        gender: input.gender,
        passwordHash,
        role: input.kind === 'STAFF' ? 'ADMIN_STAFF' : 'MAINTENANCE_WORKER',
        ...(input.kind === 'STAFF'
          ? { staffProfile: { create: { department: input.department, isOnDuty: true } } }
          : { workerProfile: { create: { specialization: input.department } } }),
      },
    });
    await audit(tx, actor.id, 'STAFF_CREATED', 'User', u.id, { role: u.role });
    return u;
  });
  return { id: user.id, credentials: { email: user.email, temporaryPassword } };
}

// Deactivates rather than deletes so payment/audit history keeps its author.
export async function deactivateStaff(actor: Actor, userId: string) {
  if (actor.role !== 'SUPER_ADMIN') throw forbidden();
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || !['ADMIN_STAFF', 'MAINTENANCE_WORKER'].includes(u.role)) throw notFound('الموظف');
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive: false } });
    await tx.session.deleteMany({ where: { userId } });
    await audit(tx, actor.id, 'STAFF_DEACTIVATED', 'User', userId);
  });
}

export async function toggleDuty(actor: Actor, userId: string) {
  if (actor.role !== 'SUPER_ADMIN' && actor.id !== userId) throw forbidden();
  const u = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true, workerProfile: true } });
  if (!u || !u.isActive) throw notFound('الموظف');
  if (u.staffProfile) {
    await prisma.staffProfile.update({ where: { id: u.staffProfile.id }, data: { isOnDuty: !u.staffProfile.isOnDuty } });
  } else if (u.workerProfile) {
    await prisma.workerProfile.update({ where: { id: u.workerProfile.id }, data: { isAvailable: !u.workerProfile.isAvailable } });
  } else {
    throw notFound('الموظف');
  }
}
