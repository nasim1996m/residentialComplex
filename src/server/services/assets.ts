import type { z } from 'zod';
import { prisma } from '../db';
import { type Actor, assertApartmentAccess, isManagement } from '../auth';
import { forbidden, notFound } from '../errors';
import { generateCode } from '../password';
import type { garageSchema, vehicleSchema } from '../validation';
import { audit } from './audit';

export async function addVehicle(actor: Actor, apartmentId: string, input: z.infer<typeof vehicleSchema>) {
  assertApartmentAccess(actor, apartmentId);
  const apt = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apt) throw notFound('الشقة');
  return prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({
      data: {
        apartmentId,
        residentId: actor.role === 'RESIDENT' ? actor.residentProfileId : null,
        plateNumber: input.plateNumber,
        makeModel: input.makeModel,
        color: input.color || null,
        rfidBadgeCode: generateCode('RFID'),
      },
    });
    await audit(tx, actor.id, 'VEHICLE_ADDED', 'Vehicle', v.id, { apartmentId, plateNumber: v.plateNumber });
    return v;
  });
}

export async function removeVehicle(actor: Actor, vehicleId: string) {
  const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!v) throw notFound('السيارة');
  assertApartmentAccess(actor, v.apartmentId);
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.delete({ where: { id: v.id } });
    await audit(tx, actor.id, 'VEHICLE_REMOVED', 'Vehicle', v.id, { apartmentId: v.apartmentId, plateNumber: v.plateNumber });
  });
  return { apartmentId: v.apartmentId };
}

export async function assignGarageSpot(actor: Actor, apartmentId: string, input: z.infer<typeof garageSchema>) {
  if (!isManagement(actor)) throw forbidden();
  const apt = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apt) throw notFound('الشقة');
  return prisma.$transaction(async (tx) => {
    const spot = await tx.garageSpot.create({
      data: {
        apartmentId,
        spotNumber: input.spotNumber.toUpperCase(),
        zoneFloor: input.zoneFloor,
        accessBarcode: generateCode('BAR'),
        isOccupied: true,
      },
    });
    await audit(tx, actor.id, 'GARAGE_ASSIGNED', 'GarageSpot', spot.id, { apartmentId, spotNumber: spot.spotNumber });
    return spot;
  });
}
