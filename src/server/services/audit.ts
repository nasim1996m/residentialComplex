import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export function audit(
  tx: Tx,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  details?: Prisma.InputJsonValue,
) {
  return tx.auditLog.create({ data: { actorId, action, entity, entityId, details } });
}
