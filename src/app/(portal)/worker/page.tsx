import { WorkerPortal } from '@/components/portals/worker-portal';
import { guard } from '../guard';

export default async function WorkerPage() {
  await guard('SUPER_ADMIN', 'ADMIN_STAFF', 'MAINTENANCE_WORKER');
  return <WorkerPortal />;
}
