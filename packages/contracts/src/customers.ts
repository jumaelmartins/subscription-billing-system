import { z } from 'zod';

export const customerStatus = z.enum(['active', 'inactive']);
export type CustomerStatus = z.infer<typeof customerStatus>;

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  document: z.string().min(1).optional(),
});

export const updateCustomerSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    document: z.string().min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'at least one field is required' });

export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
