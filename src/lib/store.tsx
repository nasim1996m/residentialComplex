'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type {
  Apartment,
  Building,
  Credentials,
  FinancialSummary,
  MaintenanceTicket,
  Me,
  OccupancyStatus,
  Service,
  StaffMember,
  TicketStatus,
} from './types';

export interface SaleInput {
  apartmentId: string;
  buyer: { fullName: string; email: string; phone: string; gender: string; familyMembersCount: number };
  paymentType: 'FULL_CASH' | 'INSTALLMENTS';
  occupancyStatus: 'OWNER_OCCUPIED' | 'RENTED' | 'VACANT_SOLD';
  downPayment?: number;
  installmentMonths?: number;
}

export interface StaffInput {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  kind: 'STAFF' | 'WORKER';
  department: string;
}

interface AppContextType {
  me: Me;
  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  buildings: Building[];
  myApartment: Apartment | null;
  services: Service[];
  staff: StaffMember[];
  tickets: MaintenanceTicket[];
  summary: FinancialSummary | null;
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  selectedApartment: Apartment | null;
  setSelectedApartment: (apt: Apartment | null) => void;
  refresh: () => Promise<void>;
  registerApartmentSale: (input: SaleInput) => Promise<Credentials>;
  updateApartmentOccupancy: (aptId: string, status: OccupancyStatus) => Promise<void>;
  addVehicleToApartment: (aptId: string, v: { plateNumber: string; makeModel: string; color?: string }) => Promise<void>;
  removeVehicleFromApartment: (vehicleId: string) => Promise<void>;
  addGarageSpotToApartment: (aptId: string, g: { spotNumber: string; zoneFloor: string }) => Promise<void>;
  payInstallment: (installmentId: string) => Promise<void>;
  payCharge: (chargeId: string) => Promise<void>;
  generateCharges: (period: string) => Promise<{ created: number; eligibleSubscriptions: number }>;
  addStaffMember: (input: StaffInput) => Promise<Credentials>;
  removeStaffMember: (userId: string) => Promise<void>;
  toggleStaffDuty: (userId: string) => Promise<void>;
  toggleServiceAvailability: (serviceId: string) => Promise<void>;
  createMaintenanceTicket: (t: { title: string; description: string; apartmentId?: string }) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ me, children }: { me: Me; children: React.ReactNode }) {
  const isManagement = me.role === 'SUPER_ADMIN' || me.role === 'ADMIN_STAFF';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [myApartment, setMyApartment] = useState<Apartment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const jobs: Promise<unknown>[] = [
        api<Service[]>('/api/services').then(setServices),
        api<MaintenanceTicket[]>('/api/tickets').then(setTickets),
      ];
      if (isManagement) {
        jobs.push(
          api<Building[]>('/api/buildings').then((b) => {
            setBuildings(b);
            setSelectedBuildingId((cur) => cur || b[0]?.id || '');
          }),
          api<StaffMember[]>('/api/staff').then(setStaff),
          api<FinancialSummary>('/api/finance/summary').then(setSummary),
        );
      }
      if (me.role === 'RESIDENT') jobs.push(api<Apartment | null>('/api/me/apartment').then(setMyApartment));
      await Promise.all(jobs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isManagement, me.role]);

  useEffect(() => {
    // Initial load from the API; state is only set after the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Runs a mutation, surfaces its error, then reloads data from the database.
  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setError(null);
      try {
        return await fn();
      } catch (e) {
        setError((e as Error).message);
        throw e;
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  const selectedApartment = useMemo(() => {
    if (!selectedApartmentId) return null;
    const all = buildings.flatMap((b) => b.apartments);
    return all.find((a) => a.id === selectedApartmentId) ?? (myApartment?.id === selectedApartmentId ? myApartment : null);
  }, [buildings, myApartment, selectedApartmentId]);

  const value: AppContextType = {
    me,
    loading,
    error,
    setError,
    buildings,
    myApartment,
    services,
    staff,
    tickets,
    summary,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedApartment,
    setSelectedApartment: (apt) => setSelectedApartmentId(apt?.id ?? null),
    refresh,
    registerApartmentSale: (input) =>
      run(async () => (await api<{ credentials: Credentials }>('/api/sales', { method: 'POST', body: input })).credentials),
    updateApartmentOccupancy: (aptId, status) =>
      run(() => api(`/api/apartments/${aptId}/occupancy`, { method: 'POST', body: { status } })).then(() => {}),
    addVehicleToApartment: (aptId, v) =>
      run(() => api(`/api/apartments/${aptId}/vehicles`, { method: 'POST', body: v })).then(() => {}),
    removeVehicleFromApartment: (vehicleId) => run(() => api(`/api/vehicles/${vehicleId}`, { method: 'DELETE' })).then(() => {}),
    addGarageSpotToApartment: (aptId, g) =>
      run(() => api(`/api/apartments/${aptId}/garage`, { method: 'POST', body: g })).then(() => {}),
    payInstallment: (id) => run(() => api(`/api/installments/${id}/pay`, { method: 'POST' })).then(() => {}),
    payCharge: (id) => run(() => api(`/api/charges/${id}/pay`, { method: 'POST' })).then(() => {}),
    generateCharges: (period) => run(() => api('/api/billing/charges', { method: 'POST', body: { period } })),
    addStaffMember: (input) =>
      run(async () => (await api<{ credentials: Credentials }>('/api/staff', { method: 'POST', body: input })).credentials),
    removeStaffMember: (id) => run(() => api(`/api/staff/${id}`, { method: 'DELETE' })).then(() => {}),
    toggleStaffDuty: (id) => run(() => api(`/api/staff/${id}/duty`, { method: 'POST' })).then(() => {}),
    toggleServiceAvailability: (id) => {
      const s = services.find((x) => x.id === id);
      return run(() => api(`/api/services/${id}`, { method: 'PATCH', body: { isAvailable: !s?.isAvailable } })).then(() => {});
    },
    createMaintenanceTicket: (t) => run(() => api('/api/tickets', { method: 'POST', body: t })).then(() => {}),
    updateTicketStatus: (id, status) => run(() => api(`/api/tickets/${id}`, { method: 'PATCH', body: { status } })).then(() => {}),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
