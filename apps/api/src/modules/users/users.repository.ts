import { eq } from 'drizzle-orm';
import { db } from '../../shared/database/client';
import { users, type User } from '../../shared/database/schema';

export function findUserByEmail(email: string): Promise<User | undefined> {
  return db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);
}

export function findUserById(id: string): Promise<User | undefined> {
  return db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((rows) => rows[0]);
}
