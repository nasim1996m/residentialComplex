import { redirect } from 'next/navigation';
import { getActor } from '@/server/auth';
import { AppProvider } from '@/lib/store';
import { Navbar } from '@/components/navbar';
import { ErrorBanner } from '@/components/error-banner';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const me = { id: actor.id, role: actor.role, fullName: actor.fullName, email: actor.email, apartmentId: actor.apartmentId };
  return (
    <AppProvider me={me}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <ErrorBanner />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">{children}</main>
      </div>
    </AppProvider>
  );
}
