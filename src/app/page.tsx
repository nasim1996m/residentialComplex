'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { AdminPortal } from '@/components/portals/admin-portal';
import { StaffPortal } from '@/components/portals/staff-portal';
import { ResidentPortal } from '@/components/portals/resident-portal';
import { WorkerPortal } from '@/components/portals/worker-portal';
import { ApartmentModal } from '@/components/apartment-modal';

export default function Home() {
  const { currentRole } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {currentRole === 'SUPER_ADMIN' && <AdminPortal />}
      {currentRole === 'ADMIN_STAFF' && <StaffPortal />}
      {currentRole === 'RESIDENT' && <ResidentPortal />}
      {currentRole === 'MAINTENANCE_WORKER' && <WorkerPortal />}

      {/* Global Apartment Detail Modal */}
      <ApartmentModal />
    </main>
  );
}
