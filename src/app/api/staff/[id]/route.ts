import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { deactivateStaff } from '@/server/services/staff';
import { idSchema } from '@/server/validation';

export const DELETE = handler<{ id: string }>(async (_req, { id }) =>
  deactivateStaff(await requireActor('SUPER_ADMIN'), idSchema.parse(id)),
);
