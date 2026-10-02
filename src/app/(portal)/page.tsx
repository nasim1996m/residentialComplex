import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth';

const HOME = {
  SUPER_ADMIN: '/admin',
  ADMIN_STAFF: '/staff',
  MAINTENANCE_WORKER: '/worker',
  RESIDENT: '/resident',
} as const;

export default async function Home() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  redirect(HOME[actor.role]);
}
