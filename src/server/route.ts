import { NextResponse, type NextRequest } from 'next/server';
import { forbidden, toErrorResponse } from './errors';

type Ctx<P> = { params: Promise<P> };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Rejects cross-site state-changing requests (CSRF) by requiring a same-origin Origin header.
function assertSameOrigin(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return;
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) throw forbidden();
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden();
  }
  if (originHost !== host) throw forbidden();
}

export function handler<P = Record<string, string>>(
  fn: (req: NextRequest, params: P) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      const result = await fn(req, await ctx.params);
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export async function readJson(req: NextRequest): Promise<unknown> {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > 100_000) throw forbidden();
  try {
    return await req.json();
  } catch {
    return {};
  }
}
