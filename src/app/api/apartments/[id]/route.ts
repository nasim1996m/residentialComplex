import { requireActor } from '@/server/auth';
import { handler } from '@/server/route';
import { getApartment } from '@/server/services/apartments';
import { idSchema } from '@/server/validation';

export const GET = handler<{ id: string }>(async (_req, { id }) => getApartment(await requireActor(), idSchema.parse(id)));
