import { AdminPortal } from '@/components/portals/admin-portal';
import { ApartmentModal } from '@/components/apartment-modal';
import { guard } from '../guard';

export default async function AdminPage() {
  await guard('SUPER_ADMIN');
  return (
    <>
      <AdminPortal />
      <ApartmentModal />
    </>
  );
}
