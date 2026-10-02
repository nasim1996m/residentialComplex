export type Role = 'SUPER_ADMIN' | 'ADMIN_STAFF' | 'MAINTENANCE_WORKER' | 'RESIDENT';

export type BuildingStatus = 'COMPLETED' | 'UNDER_CONSTRUCTION';

export type PaymentType = 'FULL_CASH' | 'INSTALLMENTS';

export type OccupancyStatus = 'VACANT_UNSOLD' | 'VACANT_SOLD' | 'OWNER_OCCUPIED' | 'RENTED';

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface Me {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  apartmentId: string | null;
}

export interface Vehicle {
  id: string;
  apartmentId: string;
  plateNumber: string;
  makeModel: string;
  color?: string;
  rfidBadgeCode?: string;
}

export interface GarageSpot {
  id: string;
  apartmentId?: string;
  spotNumber: string;
  zoneFloor: string;
  accessBarcode?: string;
  isOccupied: boolean;
}

export interface ResidentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  avatarUrl?: string;
  isContractOwner: boolean;
  hasAccessBadge: boolean;
  badgeCode?: string;
  familyMembersCount: number;
}

export interface Installment {
  id: string;
  apartmentId: string;
  sequenceNumber: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface UnpaidCharge {
  id: string;
  period: string;
  amount: number;
  serviceName: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  monthlyPrice: number;
  isAvailable: boolean;
  isDefault: boolean;
  subscribedCount: number;
}

export interface Subscription {
  id: string;
  apartmentId: string;
  serviceId: string;
  serviceName: string;
  monthlyPrice: number;
  startDate: string;
  isActive: boolean;
}

export interface MaintenanceTicket {
  id: string;
  apartmentId: string;
  apartmentCode: string;
  title: string;
  description: string;
  status: TicketStatus;
  workerName?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  avatarUrl?: string;
  role: Role;
  department: string;
  isOnDuty: boolean;
}

export interface Apartment {
  id: string;
  buildingId: string;
  buildingNumber: number;
  floorNumber: number;
  apartmentNumber: number;
  sequentialCode: string;
  isSold: boolean;
  price: number;
  paymentType?: PaymentType;
  downPayment: number | null;
  installmentMonths: number | null;
  occupancyStatus: OccupancyStatus;
  isOccupied: boolean; // Triggers Subscription Eligibility
  contractOwner?: ResidentProfile;
  vehicles: Vehicle[];
  garageSpots: GarageSpot[];
  subscriptions: Subscription[];
  installments: Installment[];
  unpaidCharges: UnpaidCharge[];
  financials: {
    paidInstallments: number;
    remainingInstallments: number;
    overdueInstallments: number;
    nextDueDate: string | null;
    unpaidChargesTotal: number;
  };
}

export interface Building {
  id: string;
  buildingNumber: number;
  name: string;
  status: BuildingStatus;
  totalFloors: number;
  apartmentsPerFloor: number;
  totalApartments: number;
  apartments: Apartment[];
}

export interface FinancialSummary {
  soldApartments: number;
  totalSalesValue: number;
  totalCollected: number;
  collected: Record<string, { amount: number; count: number }>;
  outstandingInstallments: { amount: number; count: number };
  overdueInstallments: { amount: number; count: number };
  unpaidSubscriptionCharges: { amount: number; count: number };
  paidSubscriptionCharges: { amount: number; count: number };
}

export interface Credentials {
  email: string;
  temporaryPassword: string;
}
