import { z } from 'zod';
import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { generateMonthlyCharges } from '@/server/services/finance';
import { periodSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  const actor = await requireActor('SUPER_ADMIN', 'ADMIN_STAFF');
  const { period } = z.object({ period: periodSchema }).parse(await readJson(req));
  return generateMonthlyCharges(actor, period);
});
