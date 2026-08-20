import postgres from 'postgres';
import { env } from '../../config/env';

/** Shared postgres.js client (lazy TCP connect on first query). */
export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  onnotice: () => {},
});

/**
 * Liveness ping bounded by a short timeout so `/health` stays fast even when the
 * database is unreachable (the query settles to `false` instead of hanging).
 */
export async function pingDatabase(timeoutMs = 1500): Promise<boolean> {
  const query = sql`select 1`.then(() => true).catch(() => false);
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
  return Promise.race([query, timeout]);
}
