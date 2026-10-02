import { NextResponse } from 'next/server';
import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { getApartment } from '@/server/services/apartments';

export const GET = handler(async () => {
  const actor = await requireActor('RESIDENT');
  if (!actor.apartmentId) return NextResponse.json(null);
  return getApartment(actor, actor.apartmentId);
});
