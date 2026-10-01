import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { financialSummary } from '@/server/services/finance';

export const GET = handler(async () => financialSummary(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF')));
