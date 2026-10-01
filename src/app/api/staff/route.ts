import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { createStaff, listStaff } from '@/server/services/staff';
import { staffSchema } from '@/server/validation';

export const GET = handler(async () => listStaff(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF')));

export const POST = handler(async (req) => {
  const actor = await requireActor('SUPER_ADMIN');
  return createStaff(actor, staffSchema.parse(await readJson(req)));
});
