import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = () => new AppError(401, 'يجب تسجيل الدخول أولاً');
export const forbidden = () => new AppError(403, 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
export const notFound = (what = 'العنصر') => new AppError(404, `${what} غير موجود`);
export const conflict = (message: string) => new AppError(409, message);
export const badRequest = (message: string) => new AppError(400, message);

// Converts any thrown error into a JSON response without leaking internals.
export function toErrorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'البيانات المدخلة غير صالحة', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
      { status: 400 },
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'القيمة مستخدمة مسبقاً (مكررة)' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    }
  }
  console.error(err);
  return NextResponse.json({ error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
}
