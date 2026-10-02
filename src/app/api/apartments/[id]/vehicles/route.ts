import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { addVehicle } from '@/server/services/assets';
import { idSchema, vehicleSchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (req, { id }) => {
  const actor = await requireActor('SUPER_ADMIN', 'ADMIN_STAFF', 'RESIDENT');
  return addVehicle(actor, idSchema.parse(id), vehicleSchema.parse(await readJson(req)));
});
