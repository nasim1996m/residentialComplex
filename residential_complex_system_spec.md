# System Prompt & Specification: Residential Complex Management System

> **Role & Purpose**: You are an expert Full-Stack Software Architect and Lead Developer. Your task is to design and implement a comprehensive, scalable, and modern **Residential Complex Management Web Application** (نظام إدارة المجمعات السكنية).

---

## 1. Tech Stack Requirements

- **Framework**: Next.js (latest App Router with TypeScript)
- **Database & ORM**: PostgreSQL via **Supabase** & **Prisma ORM**
- **Authentication**: **Supabase Auth** with **Google OAuth** and Role-Based Access Control (RBAC)
- **Styling & UI**: **Tailwind CSS** + **shadcn/ui** components + Lucide Icons
- **State & Data Fetching**: React Server Components, Server Actions, TanStack Query (React Query)
- **Form Handling & Validation**: React Hook Form + Zod

---

## 2. Domain & Business Rules

### 2.1 Complex & Building Architecture Matrix
- **Buildings Count**: 7 Buildings total.
  - **5 Buildings**: Completed and active.
  - **2 Buildings**: Under construction (marked as `UNDER_CONSTRUCTION`).
- **Floors per Building**: 5 Floors.
- **Apartments per Floor**: 4 Apartments.
- **Total Capacity**: 20 Apartments per completed building (100 active apartments across completed buildings, 140 total when construction completes).
- **Sequential Apartment Numbering System**: Format `B{BuildingNo}-F{FloorNo}-A{ApartmentNo}` (e.g., `B01-F02-A07`).

### 2.2 Apartment Financial & Occupancy Matrix
Each apartment tracks:
1. **Sale Status**: `IS_SOLD` (`true` / `false`).
2. **Payment Type**: `FULL_CASH` or `INSTALLMENTS`.
   - If `INSTALLMENTS`: Total Price, Down Payment, Monthly Installment Amount, Paid Amount, Remaining Amount, Next Payment Due Date, Installment Breakdown Schedule.
3. **Occupancy Status**:
   - `VACANT_SOLD`: Sold to an owner, but left empty (Unoccupied).
   - `OWNER_OCCUPIED`: Sold and inhabited by the primary owner/family.
   - `RENTED`: Occupied by a tenant.
4. **Subscription & Services Eligibility Logic**:
   - **CRITICAL RULE**: Services and monthly subscription fees are **ONLY** charged if `isOccupied == true` (i.e. status is `OWNER_OCCUPIED` or `RENTED`).
   - If an apartment is `VACANT_SOLD` or unsold, operational subscription services (cleaning, waste management, elevator maintenance, social facilities) are paused or exempted.

### 2.3 Multiple Vehicles & Garage Allocation
- Each apartment can have **multiple vehicles** registered.
- Each vehicle tracks: License Plate Number, Make/Model, Color, Owner Resident, RFID Badge / Access Pass Code.
- Each apartment can be allocated **one or multiple Garage / Parking Spots**.
- Each Garage Spot tracks: Spot Number (e.g., `G1-P104`), Floor/Zone, Gate Access Code/Barcode, Allocation Status.

---

## 3. User Roles & Access Control Matrix

The system supports **4 distinct user roles**:

### A. Super Admin (System / Complex Owner)
- Full control over all 7 buildings, floor maps, and apartment inventories.
- Overview of total sales, collected cash, pending installments, and revenue analytics.
- Ability to assign/revoke administrative staff and set service fees.
- Global audit logs and system settings.

### B. Administrative Staff (الموظفين - إداري)
- Follow up on resident records, contract owner verification, and ID photo approvals.
- Manage subscription billing and record manual/online payments.
- Real-time **On-Duty Status** toggle (`isOnDuty: true/false`) and department categorization (e.g., Billing, Customer Service, Security).
- Monitor occupied vs vacant apartments.

### C. Freelance / Maintenance Workers (عمال - فريلانس)
- Receive and manage assigned maintenance tasks (e.g., plumbing, electrical, HVAC).
- Update ticket statuses (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
- View work logs and task schedules.

### D. Apartment Resident / Owner (اليوزر / المالك)
- **Profile Details**: Full Name, Avatar/Photo, Gender, Phone Number, Contract Owner status (`isContractOwner: true/false`), Civil ID photo, Residence Card photo.
- **Apartment Overview**: View assigned apartment details, payment plan, installment history, remaining balances.
- **Multiple Vehicles & Garage**: Register/manage multiple vehicles and view assigned garage spot details & RFID access badges.
- **Services & Subscriptions**: View active services, monthly dues, pay invoices.
- **Family & Household**: Manage registered family members residing in the apartment.
- **Support & Maintenance**: Submit maintenance requests to complex workers.

---

## 4. Complete Prisma Database Schema Blueprint

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPER_ADMIN
  ADMIN_STAFF
  MAINTENANCE_WORKER
  RESIDENT
}

enum BuildingStatus {
  COMPLETED
  UNDER_CONSTRUCTION
}

enum PaymentType {
  FULL_CASH
  INSTALLMENTS
}

enum OccupancyStatus {
  VACANT_UNSOLD
  VACANT_SOLD
  OWNER_OCCUPIED
  RENTED
}

enum TicketStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  CANCELLED
}

model User {
  id                  String               @id @default(uuid())
  supabaseAuthId      String               @unique
  email               String               @unique
  fullName            String
  avatarUrl           String?
  gender              String?
  phone               String?
  role                Role                 @default(RESIDENT)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  // Resident Profile Links
  residentProfile     ResidentProfile?
  staffProfile        StaffProfile?
  workerProfile       WorkerProfile?
}

model Building {
  id                  String               @id @default(uuid())
  buildingNumber      Int                  @unique
  name                String               // e.g. Building A
  status              BuildingStatus       @default(COMPLETED)
  totalFloors         Int                  @default(5)
  apartmentsPerFloor  Int                  @default(4)
  totalApartments     Int                  @default(20)

  apartments          Apartment[]
}

model Apartment {
  id                  String               @id @default(uuid())
  buildingId          String
  building            Building             @relation(fields: [buildingId], references: [id])
  floorNumber         Int                  // 1 to 5
  apartmentNumber     Int                  // 1 to 4 per floor
  sequentialCode      String               @unique // e.g. B01-F02-A07

  // Sale & Ownership Attributes
  isSold              Boolean              @default(false)
  price               Decimal              @db.Decimal(12, 2)
  paymentType         PaymentType?
  
  // Occupancy
  occupancyStatus     OccupancyStatus      @default(VACANT_UNSOLD)
  isOccupied          Boolean              @default(false) // Triggers Subscription Eligibility

  // Relations
  residents           ResidentProfile[]
  installments        Installment[]
  subscriptions       Subscription[]
  vehicles            Vehicle[]            // Multiple Vehicles per Apartment
  garageSpots         GarageSpot[]         // Multiple Garage Spots per Apartment
  maintenanceTickets MaintenanceTicket[]

  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
}

model ResidentProfile {
  id                  String               @id @default(uuid())
  userId              String               @unique
  user                User                 @relation(fields: [userId], references: [id])
  apartmentId         String?
  apartment           Apartment?           @relation(fields: [apartmentId], references: [id])

  isContractOwner     Boolean              @default(false)
  idCardPhotoUrl      String?
  residenceCardUrl    String?
  hasAccessBadge      Boolean              @default(false)
  badgeCode           String?
  familyMembersCount  Int                  @default(1)

  vehicles            Vehicle[]
  createdAt           DateTime             @default(now())
}

model Vehicle {
  id                  String               @id @default(uuid())
  apartmentId         String
  apartment           Apartment            @relation(fields: [apartmentId], references: [id], onDelete: Cascade)
  residentId          String?
  resident            ResidentProfile?     @relation(fields: [residentId], references: [id])
  
  plateNumber         String               @unique
  makeModel           String               // e.g. Toyota Camry 2024
  color               String?
  rfidBadgeCode       String?              // Gate entry badge
  
  createdAt           DateTime             @default(now())
}

model GarageSpot {
  id                  String               @id @default(uuid())
  apartmentId         String?
  apartment           Apartment?           @relation(fields: [apartmentId], references: [id])
  
  spotNumber          String               @unique // e.g. G1-P104
  zoneFloor           String               // e.g. Basement 1
  accessBarcode       String?
  isOccupied          Boolean              @default(false)
}

model StaffProfile {
  id                  String               @id @default(uuid())
  userId              String               @unique
  user                User                 @relation(fields: [userId], references: [id])
  department          String               // e.g. Accounting, Operations, Security
  isOnDuty            Boolean              @default(false)
}

model WorkerProfile {
  id                  String               @id @default(uuid())
  userId              String               @unique
  user                User                 @relation(fields: [userId], references: [id])
  specialization      String               // e.g. Plumbing, Electrician, General Maintenance
  isAvailable         Boolean              @default(true)

  tickets             MaintenanceTicket[]
}

model Service {
  id                  String               @id @default(uuid())
  name                String               // e.g. Security, Trash Collection, Elevator Maint.
  monthlyPrice        Decimal              @db.Decimal(10, 2)
  isAvailable         Boolean              @default(true)
  
  subscriptions       Subscription[]
}

model Subscription {
  id                  String               @id @default(uuid())
  apartmentId         String
  apartment           Apartment            @relation(fields: [apartmentId], references: [id])
  serviceId           String
  service             Service              @relation(fields: [serviceId], references: [id])
  
  startDate           DateTime             @default(now())
  isActive            Boolean              @default(true)
  payments            Payment[]
}

model Installment {
  id                  String               @id @default(uuid())
  apartmentId         String
  apartment           Apartment            @relation(fields: [apartmentId], references: [id])
  dueDate             DateTime
  amount              Decimal              @db.Decimal(10, 2)
  isPaid              Boolean              @default(false)
  paidAt              DateTime?
}

model Payment {
  id                  String               @id @default(uuid())
  subscriptionId      String?
  subscription        Subscription?        @relation(fields: [subscriptionId], references: [id])
  amount              Decimal              @db.Decimal(10, 2)
  paymentDate         DateTime             @default(now())
  receiptUrl          String?
  notes               String?
}

model MaintenanceTicket {
  id                  String               @id @default(uuid())
  apartmentId         String
  apartment           Apartment            @relation(fields: [apartmentId], references: [id])
  workerId            String?
  worker              WorkerProfile?       @relation(fields: [workerId], references: [id])
  
  title               String
  description         String
  status              TicketStatus         @default(PENDING)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
}
```

---

## 5. Application Structure & Route Map (Next.js App Router)

```text
app/
├── (auth)/
│   ├── login/
│   └── auth/callback/
├── (dashboard)/
│   ├── admin/                 # Super Admin Control Center
│   │   ├── buildings/         # 7 Buildings overview & floor map
│   │   ├── apartments/        # Inventory & sales status
│   │   ├── financials/        # Cash, Installments, Subscriptions
│   │   ├── staff/             # Administrative staff management
│   │   └── services/          # Services catalog & pricing
│   ├── staff/                 # Administrative Staff Portal
│   │   ├── subscriptions/     # Monthly dues collection & tracking
│   │   ├── residents/         # Resident records & contract owners
│   │   └── duty-status/       # Toggle On-Duty status
│   ├── resident/              # Resident / Apartment Owner Portal
│   │   ├── my-apartment/      # Overview, contract & family members
│   │   ├── vehicles-garage/   # Manage multiple cars & assigned garage spots
│   │   ├── installments/      # Payment breakdown & due dates
│   │   ├── subscriptions/     # Active services & pay dues
│   │   └── maintenance/       # Submit & track repair tickets
│   └── worker/                # Maintenance Worker Portal
│       └── tickets/           # Assigned work tickets & status updates
├── api/                       # API Handlers & Webhooks
└── components/
    ├── ui/                    # shadcn/ui components
    ├── building-grid.tsx      # Interactive 5-floor x 4-apartment grid
    ├── vehicle-manager.tsx    # Multi-vehicle CRUD widget
    └── garage-allocator.tsx   # Parking spot manager
```

---

## 6. Key UI/UX Guidelines (shadcn/ui & Modern Aesthetics)

1. **Building Visual Grid**:
   - Provide an interactive 2D grid component for each building showing **5 floors x 4 apartments** with color-coded status badges:
     - 🟩 `Owner Occupied`
     - 🟦 `Rented`
     - 🟧 `Vacant (Sold)`
     - ⬜ `Unsold / Vacant`
     - 🚧 `Under Construction` (Buildings 6 & 7)
2. **Vehicle & Garage Card Widget**:
   - Display registered cars for an apartment with license plate badges, RFID indicator, and linked parking spot number.
3. **Responsive Dark/Light Mode**:
   - Built with Tailwind CSS CSS variables, smooth transitions, and glassmorphism cards.
4. **Subscription Automation Banner**:
   - Alert indicator showing whether an apartment is currently eligible for monthly subscriptions based on its occupancy status.

---

## 7. Step-by-Step Execution Plan for AI Implementer

1. Initialize Next.js project with Tailwind CSS and `shadcn/ui`.
2. Configure Supabase client and Auth (Google OAuth).
3. Push the Prisma Schema to PostgreSQL database.
4. Seed initial database records:
   - 7 Buildings (5 `COMPLETED`, 2 `UNDER_CONSTRUCTION`).
   - 20 Apartments for each completed building with sequential codes (`B01-F01-A01` to `B05-F05-A04`).
   - Default services (Security, Cleaning, Elevator Maintenance, Trash Collection).
5. Implement Role-Based Access Control (RBAC) middleware for `/admin`, `/staff`, `/resident`, and `/worker`.
6. Build user interfaces using `shadcn/ui` components (Tables, Dialogs, Badges, Tabs, Forms).
