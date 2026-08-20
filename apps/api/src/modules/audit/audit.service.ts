import { desc } from 'drizzle-orm';
import { db } from '../../shared/database/client';
import { auditLog, type NewAuditLog } from '../../shared/database/schema';

/** Accepts the base client or a transaction — both expose `.insert`. */
type Inserter = Pick<typeof db, 'insert'>;

/** Writes an audit entry synchronously (call inside the domain transaction). */
export function recordAudit(executor: Inserter, entry: NewAuditLog) {
  return executor.insert(auditLog).values(entry);
}

export function listAudit(limit = 50, offset = 0) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit).offset(offset);
}
