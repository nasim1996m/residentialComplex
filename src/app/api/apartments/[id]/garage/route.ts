import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { assignGarageSpot } from '@/server/services/assets';
import { garageSchema, idSchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (req, { id }) => {
  const actor = await requireActor('SUPER_ADMIN', 'ADMIN_STAFF');
  return assignGarageSpot(actor, idSchema.parse(id), garageSchema.parse(await readJson(req)));
});
