import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { updateTicketStatus } from '@/server/services/tickets';
import { idSchema, ticketStatusSchema } from '@/server/validation';

export const PATCH = handler<{ id: string }>(async (req, { id }) => {
  const { status } = ticketStatusSchema.parse(await readJson(req));
  return updateTicketStatus(await requireActor(), idSchema.parse(id), status);
});
