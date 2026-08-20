import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Public representation of a user (never includes the password hash). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
