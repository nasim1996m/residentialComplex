import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { listBuildings } from '@/server/services/apartments';

export const GET = handler(async () => listBuildings(await requireActor('SUPER_ADMIN', 'ADMIN_STAFF')));
