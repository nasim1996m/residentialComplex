import type { NextRequest } from 'next/server';
import { createSession } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { authenticate } from '@/server/services/auth-service';
import { loginSchema } from '@/server/validation';

export const POST = handler(async (req: NextRequest) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const user = await authenticate(email, password, ip);
  await createSession(user.id);
  return { role: user.role };
});
