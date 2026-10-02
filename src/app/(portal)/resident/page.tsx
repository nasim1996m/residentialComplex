import { ResidentPortal } from '@/components/portals/resident-portal';
import { guard } from '../guard';

export default async function ResidentPage() {
  await guard('RESIDENT');
  return <ResidentPortal />;
}
