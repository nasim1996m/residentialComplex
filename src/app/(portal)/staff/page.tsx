import { StaffPortal } from '@/components/portals/staff-portal';
import { ApartmentModal } from '@/components/apartment-modal';
import { guard } from '../guard';

export default async function StaffPage() {
  await guard('SUPER_ADMIN', 'ADMIN_STAFF');
  return (
    <>
      <StaffPortal />
      <ApartmentModal />
    </>
  );
}
