import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { changePassword } from '@/server/services/auth-service';
import { changePasswordSchema } from '@/server/validation';

export const POST = handler(async (req) => {
  const actor = await requireActor();
  const input = changePasswordSchema.parse(await readJson(req));
  await changePassword(actor, input.currentPassword, input.newPassword);
});
