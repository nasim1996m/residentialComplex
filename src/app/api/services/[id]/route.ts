import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { updateService } from '@/server/services/catalog';
import { idSchema, serviceUpdateSchema } from '@/server/validation';

export const PATCH = handler<{ id: string }>(async (req, { id }) => {
  const actor = await requireActor('SUPER_ADMIN');
  await updateService(actor, idSchema.parse(id), serviceUpdateSchema.parse(await readJson(req)));
});
