export type Role = 'SUPER_ADMIN' | 'ADMIN_STAFF' | 'MAINTENANCE_WORKER' | 'RESIDENT';

export type BuildingStatus = 'COMPLETED' | 'UNDER_CONSTRUCTION';

export type PaymentType = 'FULL_CASH' | 'INSTALLMENTS';

export type OccupancyStatus = 'VACANT_UNSOLD' | 'VACANT_SOLD' | 'OWNER_OCCUPIED' | 'RENTED';

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

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
  idCardPhotoUrl?: string;
  residenceCardUrl?: string;
  hasAccessBadge: boolean;
  badgeCode?: string;
  familyMembersCount: number;
}

export interface Installment {
  id: string;
  apartmentId: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Service {
  id: string;
  name: string;
  monthlyPrice: number;
  isAvailable: boolean;
  subscribedCount?: number;
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

export interface StaffProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  avatarUrl?: string;
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
  occupancyStatus: OccupancyStatus;
  isOccupied: boolean; // Triggers Subscription Eligibility
  contractOwner?: ResidentProfile;
  vehicles: Vehicle[];
  garageSpots: GarageSpot[];
  subscriptions: Subscription[];
  installments: Installment[];
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
