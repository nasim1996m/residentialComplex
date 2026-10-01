import { requireActor } from '@/server/auth';
import { handler, readJson } from '@/server/route';
import { createTicket, listTickets } from '@/server/services/tickets';
import { ticketSchema } from '@/server/validation';

export const GET = handler(async () => listTickets(await requireActor()));

export const POST = handler(async (req) => {
  const actor = await requireActor('SUPER_ADMIN', 'ADMIN_STAFF', 'RESIDENT');
  return createTicket(actor, ticketSchema.parse(await readJson(req)));
});
