import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db } from '../../shared/database/client';
import { users } from '../../shared/database/schema';
import { hashPassword } from './password';

/** Idempotently ensures the seed admin user exists. */
export async function seedAdmin(): Promise<{ created: boolean; email: string }> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, env.ADMIN_EMAIL))
    .limit(1);

  if (existing[0]) {
    return { created: false, email: env.ADMIN_EMAIL };
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await db.insert(users).values({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });

  return { created: true, email: env.ADMIN_EMAIL };
}
