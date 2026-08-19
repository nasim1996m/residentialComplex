'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Building, Role, Service, StaffProfile, MaintenanceTicket, Apartment, Vehicle, GarageSpot, ResidentProfile } from './types';
import { generateInitialBuildings, INITIAL_SERVICES } from './mock-data';

interface AppContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  buildings: Building[];
  services: Service[];
  staff: StaffProfile[];
  tickets: MaintenanceTicket[];
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  selectedApartment: Apartment | null;
  setSelectedApartment: (apt: Apartment | null) => void;
  updateApartmentOccupancy: (aptId: string, status: Apartment['occupancyStatus']) => void;
  registerApartmentSale: (aptId: string, resident: Omit<ResidentProfile, 'id' | 'userId'>, paymentType: 'FULL_CASH' | 'INSTALLMENTS', occupancyStatus: Apartment['occupancyStatus']) => void;
  addVehicleToApartment: (aptId: string, vehicle: Omit<Vehicle, 'id'>) => void;
  removeVehicleFromApartment: (aptId: string, vehicleId: string) => void;
  addGarageSpotToApartment: (aptId: string, spot: Omit<GarageSpot, 'id'>) => void;
  addStaffMember: (staffData: Omit<StaffProfile, 'id' | 'isOnDuty'>) => void;
  removeStaffMember: (staffId: string) => void;
  toggleStaffDuty: (staffId: string) => void;
  createMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'createdAt'>) => void;
  updateTicketStatus: (ticketId: string, status: MaintenanceTicket['status']) => void;
  toggleServiceAvailability: (serviceId: string) => void;
  resetToEmptyState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('SUPER_ADMIN');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('building-1');
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  useEffect(() => {
    // Generate empty initial buildings matrix
    const initial = generateInitialBuildings();
    setBuildings(initial);
  }, []);

  const resetToEmptyState = () => {
    setBuildings(generateInitialBuildings());
    setStaff([]);
    setTickets([]);
    setSelectedApartment(null);
  };

  const addStaffMember = (staffData: Omit<StaffProfile, 'id' | 'isOnDuty'>) => {
    const newStaff: StaffProfile = {
      ...staffData,
      id: `st-${Date.now()}`,
      isOnDuty: true,
      avatarUrl: staffData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    setStaff((prev) => [...prev, newStaff]);
  };

  const removeStaffMember = (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  const registerApartmentSale = (
    aptId: string,
    residentData: Omit<ResidentProfile, 'id' | 'userId'>,
    paymentType: 'FULL_CASH' | 'INSTALLMENTS',
    occupancyStatus: Apartment['occupancyStatus']
  ) => {
    setBuildings((prevBuildings) =>
      prevBuildings.map((b) => ({
        ...b,
        apartments: b.apartments.map((apt) => {
          if (apt.id === aptId) {
            const isOccupied = occupancyStatus === 'OWNER_OCCUPIED' || occupancyStatus === 'RENTED';
            
            const newResident: ResidentProfile = {
              ...residentData,
              id: `res-${Date.now()}`,
              userId: `user-${Date.now()}`,
            };

            const defaultSubscriptions = isOccupied ? [
              {
                id: `sub-${apt.id}-1`,
                apartmentId: apt.id,
                serviceId: 'srv-1',
                serviceName: 'الحراسة والأمن (Security)',
                monthlyPrice: 50,
                startDate: new Date().toISOString().split('T')[0],
                isActive: true,
              },
              {
                id: `sub-${apt.id}-2`,
                apartmentId: apt.id,
                serviceId: 'srv-2',
                serviceName: 'النظافة العامة وتجميع النفايات',
                monthlyPrice: 40,
                startDate: new Date().toISOString().split('T')[0],
                isActive: true,
              },
              {
                id: `sub-${apt.id}-3`,
                apartmentId: apt.id,
                serviceId: 'srv-3',
                serviceName: 'صيانة المصاعد الكهروميكانيكية',
                monthlyPrice: 60,
                startDate: new Date().toISOString().split('T')[0],
                isActive: true,
              },
            ] : [];

            const installments = paymentType === 'INSTALLMENTS' ? [
              { id: `inst-${apt.id}-1`, apartmentId: apt.id, dueDate: '2026-09-01', amount: 5000, isPaid: false },
              { id: `inst-${apt.id}-2`, apartmentId: apt.id, dueDate: '2026-10-01', amount: 5000, isPaid: false },
              { id: `inst-${apt.id}-3`, apartmentId: apt.id, dueDate: '2026-11-01', amount: 5000, isPaid: false },
            ] : [];

            const updatedApt: Apartment = {
              ...apt,
              isSold: true,
              paymentType,
              occupancyStatus,
              isOccupied,
              contractOwner: newResident,
              subscriptions: defaultSubscriptions,
              installments,
            };

            if (selectedApartment?.id === aptId) {
              setSelectedApartment(updatedApt);
            }
            return updatedApt;
          }
          return apt;
        }),
      }))
    );
  };

  const updateApartmentOccupancy = (aptId: string, status: Apartment['occupancyStatus']) => {
    setBuildings((prevBuildings) =>
      prevBuildings.map((b) => ({
        ...b,
        apartments: b.apartments.map((apt) => {
          if (apt.id === aptId) {
            const isOccupied = status === 'OWNER_OCCUPIED' || status === 'RENTED';
            const updatedApt = {
              ...apt,
              occupancyStatus: status,
              isOccupied,
              subscriptions: isOccupied && apt.subscriptions.length === 0 ? [
                {
                  id: `sub-${apt.id}-1`,
                  apartmentId: apt.id,
                  serviceId: 'srv-1',
                  serviceName: 'الحراسة والأمن (Security)',
                  monthlyPrice: 50,
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                },
                {
                  id: `sub-${apt.id}-2`,
                  apartmentId: apt.id,
                  serviceId: 'srv-2',
                  serviceName: 'النظافة العامة وتجميع النفايات',
                  monthlyPrice: 40,
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                },
                {
                  id: `sub-${apt.id}-3`,
                  apartmentId: apt.id,
                  serviceId: 'srv-3',
                  serviceName: 'صيانة المصاعد الكهروميكانيكية',
                  monthlyPrice: 60,
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true,
                },
              ] : apt.subscriptions,
            };
            if (selectedApartment?.id === aptId) {
              setSelectedApartment(updatedApt);
            }
            return updatedApt;
          }
          return apt;
        }),
      }))
    );
  };

  const addVehicleToApartment = (aptId: string, vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
    };

    setBuildings((prevBuildings) =>
      prevBuildings.map((b) => ({
        ...b,
        apartments: b.apartments.map((apt) => {
          if (apt.id === aptId) {
            const updatedApt = {
              ...apt,
              vehicles: [...apt.vehicles, newVehicle],
            };
            if (selectedApartment?.id === aptId) {
              setSelectedApartment(updatedApt);
            }
            return updatedApt;
          }
          return apt;
        }),
      }))
    );
  };

  const removeVehicleFromApartment = (aptId: string, vehicleId: string) => {
    setBuildings((prevBuildings) =>
      prevBuildings.map((b) => ({
        ...b,
        apartments: b.apartments.map((apt) => {
          if (apt.id === aptId) {
            const updatedApt = {
              ...apt,
              vehicles: apt.vehicles.filter((v) => v.id !== vehicleId),
            };
            if (selectedApartment?.id === aptId) {
              setSelectedApartment(updatedApt);
            }
            return updatedApt;
          }
          return apt;
        }),
      }))
    );
  };

  const addGarageSpotToApartment = (aptId: string, spotData: Omit<GarageSpot, 'id'>) => {
    const newSpot: GarageSpot = {
      ...spotData,
      id: `grg-${Date.now()}`,
    };

    setBuildings((prevBuildings) =>
      prevBuildings.map((b) => ({
        ...b,
        apartments: b.apartments.map((apt) => {
          if (apt.id === aptId) {
            const updatedApt = {
              ...apt,
              garageSpots: [...apt.garageSpots, newSpot],
            };
            if (selectedApartment?.id === aptId) {
              setSelectedApartment(updatedApt);
            }
            return updatedApt;
          }
          return apt;
        }),
      }))
    );
  };

  const toggleStaffDuty = (staffId: string) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isOnDuty: !s.isOnDuty } : s))
    );
  };

  const createMaintenanceTicket = (ticketData: Omit<MaintenanceTicket, 'id' | 'createdAt'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      createdAt: new Date().toLocaleString('ar-IQ'),
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId: string, status: MaintenanceTicket['status']) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  const toggleServiceAvailability = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        buildings,
        services,
        staff,
        tickets,
        selectedBuildingId,
        setSelectedBuildingId,
        selectedApartment,
        setSelectedApartment,
        updateApartmentOccupancy,
        registerApartmentSale,
        addVehicleToApartment,
        removeVehicleFromApartment,
        addGarageSpotToApartment,
        addStaffMember,
        removeStaffMember,
        toggleStaffDuty,
        createMaintenanceTicket,
        updateTicketStatus,
        toggleServiceAvailability,
        resetToEmptyState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
