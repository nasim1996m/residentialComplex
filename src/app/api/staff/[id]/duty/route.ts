import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { toggleDuty } from '@/server/services/staff';
import { idSchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (_req, { id }) =>
  toggleDuty(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF', 'MAINTENANCE_WORKER'), idSchema.parse(id)),
);
