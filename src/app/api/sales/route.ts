import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { registerSale } from '@/server/services/apartments';
import { saleSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  const actor = await requireActor('SUPER_ADMIN');
  return registerSale(actor, saleSchema.parse(await readJson(req)));
});
