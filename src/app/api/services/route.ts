import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { listServices } from '@/server/services/catalog';

export const GET = handler(async () => {
  await requireActor();
  return listServices();
});
