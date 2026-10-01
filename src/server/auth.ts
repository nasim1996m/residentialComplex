import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { prisma } from './db';
import { forbidden, unauthorized } from './errors';

export const SESSION_COOKIE = 'rc_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface Actor {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  residentProfileId: string | null;
  apartmentId: string | null;
  staffProfileId: string | null;
  workerProfileId: string | null;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { residentProfile: true, staffProfile: true, workerProfile: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const u = session.user;
  return {
    id: u.id,
    role: u.role,
    fullName: u.fullName,
    email: u.email,
    residentProfileId: u.residentProfile?.id ?? null,
    apartmentId: u.residentProfile?.apartmentId ?? null,
    staffProfileId: u.staffProfile?.id ?? null,
    workerProfileId: u.workerProfile?.id ?? null,
  };
}

export async function requireActor(...roles: Role[]): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw unauthorized();
  if (roles.length > 0 && !roles.includes(actor.role)) throw forbidden();
  return actor;
}

export const MANAGEMENT: Role[] = ['SUPER_ADMIN', 'ADMIN_STAFF'];
export const isManagement = (actor: Actor) => MANAGEMENT.includes(actor.role);

// Residents may only touch their own apartment; management may touch any.
export function assertApartmentAccess(actor: Actor, apartmentId: string) {
  if (isManagement(actor)) return;
  if (actor.role === 'RESIDENT' && actor.apartmentId === apartmentId) return;
  throw forbidden();
}
