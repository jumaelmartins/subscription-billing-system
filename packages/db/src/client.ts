import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? 'postgres://sbs:sbs@localhost:5432/sbs';

/** Shared postgres.js client (lazy TCP connect on first query). */
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  onnotice: () => {},
});

/** Drizzle client bound to the shared connection and full schema. */
export const db = drizzle(sql, { schema });

export type Database = typeof db;

/** Liveness ping bounded by a short timeout so callers never hang. */
export async function pingDatabase(timeoutMs = 1500): Promise<boolean> {
  const query = sql`select 1`.then(() => true).catch(() => false);
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
  return Promise.race([query, timeout]);
}
