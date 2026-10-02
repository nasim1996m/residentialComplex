import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { getActor } from '@/server/auth';

// Server-side page guard: the API enforces the same rules, this just avoids rendering a portal the user cannot use.
export async function guard(...roles: Role[]) {
  const actor = await getActor();
  if (!actor) redirect('/login');
  if (!roles.includes(actor.role)) redirect('/');
  return actor;
}
