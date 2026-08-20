import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../../config/env';

/**
 * Applies pending SQL migrations from the `drizzle/` folder using a dedicated
 * single connection. The folder sits at the package root in dev/test (cwd =
 * apps/api) and at the image root in production (cwd = /app), so cwd resolution
 * works in all environments.
 */
export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  try {
    const db = drizzle(migrationClient);
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  } finally {
    await migrationClient.end();
  }
}
