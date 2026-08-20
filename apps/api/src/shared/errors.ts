import type { z, ZodTypeAny } from 'zod';

/** Domain/HTTP error carrying an explicit status code and machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

export const notFound = (message?: string): AppError => new AppError(404, 'not_found', message);
export const conflict = (message?: string): AppError => new AppError(409, 'conflict', message);

/** Validate external input with a Zod schema, throwing a 400 AppError on failure. */
export function parseInput<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, 'invalid_input', 'invalid input', result.error.issues);
  }
  return result.data;
}
