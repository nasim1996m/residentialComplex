-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN_STAFF', 'MAINTENANCE_WORKER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "BuildingStatus" AS ENUM ('COMPLETED', 'UNDER_CONSTRUCTION');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL_CASH', 'INSTALLMENTS');

-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('VACANT_UNSOLD', 'VACANT_SOLD', 'OWNER_OCCUPIED', 'RENTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('FULL_CASH', 'DOWN_PAYMENT', 'INSTALLMENT', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "gender" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'RESIDENT',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "buildingNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BuildingStatus" NOT NULL DEFAULT 'COMPLETED',
    "totalFloors" INTEGER NOT NULL DEFAULT 5,
    "apartmentsPerFloor" INTEGER NOT NULL DEFAULT 4,
    "totalApartments" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "apartmentNumber" INTEGER NOT NULL,
    "sequentialCode" TEXT NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(12,2) NOT NULL,
    "paymentType" "PaymentType",
    "downPayment" DECIMAL(12,2),
    "installmentMonths" INTEGER,
    "soldAt" TIMESTAMP(3),
    "occupancyStatus" "OccupancyStatus" NOT NULL DEFAULT 'VACANT_UNSOLD',
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT,
    "isContractOwner" BOOLEAN NOT NULL DEFAULT false,
    "idCardPhotoUrl" TEXT,
    "residenceCardUrl" TEXT,
    "hasAccessBadge" BOOLEAN NOT NULL DEFAULT false,
    "badgeCode" TEXT,
    "familyMembersCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResidentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT,
    "plateNumber" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL,
    "color" TEXT,
    "rfidBadgeCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarageSpot" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT,
    "spotNumber" TEXT NOT NULL,
    "zoneFloor" TEXT NOT NULL,
    "accessBarcode" TEXT,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GarageSpot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "isOnDuty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCharge" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "installmentId" TEXT,
    "chargeId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "workerId" TEXT,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_buildingNumber_key" ON "Building"("buildingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_sequentialCode_key" ON "Apartment"("sequentialCode");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_buildingId_floorNumber_apartmentNumber_key" ON "Apartment"("buildingId", "floorNumber", "apartmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentProfile_userId_key" ON "ResidentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentProfile_badgeCode_key" ON "ResidentProfile"("badgeCode");

-- CreateIndex
CREATE INDEX "ResidentProfile_apartmentId_idx" ON "ResidentProfile"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_rfidBadgeCode_key" ON "Vehicle"("rfidBadgeCode");

-- CreateIndex
CREATE INDEX "Vehicle_apartmentId_idx" ON "Vehicle"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GarageSpot_spotNumber_key" ON "GarageSpot"("spotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GarageSpot_accessBarcode_key" ON "GarageSpot"("accessBarcode");

-- CreateIndex
CREATE INDEX "GarageSpot_apartmentId_idx" ON "GarageSpot"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_apartmentId_serviceId_key" ON "Subscription"("apartmentId", "serviceId");

-- CreateIndex
CREATE INDEX "SubscriptionCharge_period_idx" ON "SubscriptionCharge"("period");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_subscriptionId_period_key" ON "SubscriptionCharge"("subscriptionId", "period");

-- CreateIndex
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_apartmentId_sequenceNumber_key" ON "Installment"("apartmentId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_installmentId_key" ON "Payment"("installmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_chargeId_key" ON "Payment"("chargeId");

-- CreateIndex
CREATE INDEX "Payment_apartmentId_idx" ON "Payment"("apartmentId");

-- CreateIndex
CREATE INDEX "Payment_kind_idx" ON "Payment"("kind");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_status_idx" ON "MaintenanceTicket"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentProfile" ADD CONSTRAINT "ResidentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentProfile" ADD CONSTRAINT "ResidentProfile_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "ResidentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageSpot" ADD CONSTRAINT "GarageSpot_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCharge" ADD CONSTRAINT "SubscriptionCharge_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "SubscriptionCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
