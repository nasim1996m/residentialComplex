import { destroySession } from '@/server/auth';
import { handler } from '@/server/route';

export const POST = handler(async () => {
  await destroySession();
});
