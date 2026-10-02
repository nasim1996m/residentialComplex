import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { removeVehicle } from '@/server/services/assets';
import { idSchema } from '@/server/validation';

export const DELETE = handler<{ id: string }>(async (_req, { id }) =>
  removeVehicle(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF', 'RESIDENT'), idSchema.parse(id)),
);
