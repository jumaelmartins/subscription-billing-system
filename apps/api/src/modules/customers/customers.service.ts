import { desc, eq } from 'drizzle-orm';
import type { CreateCustomer, UpdateCustomer } from '@sbs/contracts';
import { db } from '../../shared/database/client';
import { customers } from '../../shared/database/schema';
import { conflict, notFound } from '../../shared/errors';
import { recordAudit } from '../audit/audit.service';

export const customersService = {
  list(limit: number, offset: number) {
    return db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async get(id: string) {
    const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!row) throw notFound('customer not found');
    return row;
  },

  async create(input: CreateCustomer, actorId: string) {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(customers)
        .where(eq(customers.email, input.email))
        .limit(1);
      if (existing) throw conflict('email already in use');

      const [created] = await tx
        .insert(customers)
        .values({ name: input.name, email: input.email, document: input.document ?? null })
        .returning();

      await recordAudit(tx, {
        actorId,
        action: 'customer.created',
        entityType: 'customer',
        entityId: created!.id,
        metadata: { email: created!.email },
      });
      return created!;
    });
  },

  async update(id: string, input: UpdateCustomer, actorId: string) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(customers)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      if (!updated) throw notFound('customer not found');

      await recordAudit(tx, {
        actorId,
        action: 'customer.updated',
        entityType: 'customer',
        entityId: id,
        metadata: input,
      });
      return updated;
    });
  },

  async deactivate(id: string, actorId: string) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(customers)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      if (!updated) throw notFound('customer not found');

      await recordAudit(tx, {
        actorId,
        action: 'customer.deactivated',
        entityType: 'customer',
        entityId: id,
      });
      return updated;
    });
  },
};
