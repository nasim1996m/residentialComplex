import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { setOccupancy } from '@/server/services/apartments';
import { idSchema, occupancySchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (req, { id }) => {
  const actor = await requireActor('SUPER_ADMIN', 'ADMIN_STAFF');
  const { status } = z.object({ status: occupancySchema }).parse(await readJson(req));
  return setOccupancy(actor, idSchema.parse(id), status);
});
