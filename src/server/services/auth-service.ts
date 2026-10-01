import { prisma } from '../db';
import { AppError, badRequest } from '../errors';
import { hashPassword, verifyPassword } from '../password';
import type { Actor } from '../auth';

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

// Simple per-IP limiter on top of the per-account lockout (single-instance deployments).
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX = 30;

// Only failed attempts count, so many residents behind one NAT can still sign in.
function checkIpLimit(ip: string) {
  const entry = ipAttempts.get(ip);
  if (entry && entry.resetAt > Date.now() && entry.count >= IP_MAX) {
    throw new AppError(429, 'محاولات كثيرة، حاول لاحقاً');
  }
}

function recordIpFailure(ip: string) {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || entry.resetAt < now) ipAttempts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
  else entry.count++;
}

const INVALID = () => new AppError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
// Used to equalise timing when the email does not exist.
const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==';

export async function authenticate(email: string, password: string, ip: string) {
  checkIpLimit(ip);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await verifyPassword(password, DUMMY_HASH).catch(() => false);
    recordIpFailure(ip);
    throw INVALID();
  }
  if (!user.isActive) {
    recordIpFailure(ip);
    throw INVALID();
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'الحساب مقفل مؤقتاً بسبب محاولات فاشلة متكررة');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    recordIpFailure(ip);
    throw INVALID();
  }

  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  }
  return user;
}

export async function changePassword(actor: Actor, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw badRequest('كلمة المرور الحالية غير صحيحة');
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(newPassword) } }),
    // Sign out every other device.
    prisma.session.deleteMany({ where: { userId: actor.id } }),
  ]);
}
