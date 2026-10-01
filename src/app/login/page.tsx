import { googleConfig } from '@/server/google-auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  not_registered: 'حساب Google هذا غير مسجل في المجمع. اطلب من الإدارة تسجيلك بنفس بريد Gmail.',
  google_failed: 'تعذر إكمال تسجيل الدخول بـ Google، حاول مرة أخرى.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm googleEnabled={googleConfig() !== null} initialError={(error && ERRORS[error]) || null} />;
}
