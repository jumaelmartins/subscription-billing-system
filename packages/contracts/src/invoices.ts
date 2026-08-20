import { z } from 'zod';

export const invoiceStatus = z.enum(['open', 'paid', 'failed', 'void', 'refunded']);
export type InvoiceStatus = z.infer<typeof invoiceStatus>;

export const paymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof paymentStatus>;

export const generateInvoiceSchema = z.object({
  subscriptionId: z.string().uuid(),
  dueInDays: z.number().int().nonnegative().max(90).optional(),
});

export type GenerateInvoice = z.infer<typeof generateInvoiceSchema>;
