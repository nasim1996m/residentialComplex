import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';

export const GET = handler(async () => {
  const a = await requireActor();
  return { id: a.id, role: a.role, fullName: a.fullName, email: a.email, apartmentId: a.apartmentId };
});
