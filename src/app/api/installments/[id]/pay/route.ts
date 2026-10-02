import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { payInstallment } from '@/server/services/finance';
import { idSchema } from '@/server/validation';

export const POST = handler<{ id: string }>(async (_req, { id }) =>
  payInstallment(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF'), idSchema.parse(id)),
);
