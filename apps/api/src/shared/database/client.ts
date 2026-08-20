import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { sql } from './pool';

/** Drizzle client bound to the shared postgres.js connection. */
export const db = drizzle(sql, { schema });
