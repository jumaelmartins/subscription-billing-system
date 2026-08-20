import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? 'postgres://sbs:sbs@localhost:5432/sbs';

/**
 * Applies pending SQL migrations shipped with this package. The `drizzle/`
 * folder sits one level above the compiled entry (dist/) and above src/ in dev,
 * so resolving relative to this module works in both cases and inside the
 * published package under node_modules.
 */
export async function runMigrations(): Promise<void> {
  const client = postgres(connectionString, { max: 1 });
  try {
    const db = drizzle(client);
    const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), '../drizzle');
    await migrate(db, { migrationsFolder: folder });
  } finally {
    await client.end();
  }
}
