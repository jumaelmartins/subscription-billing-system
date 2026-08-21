import { z } from 'zod';

/**
 * Environment is validated once at process startup. Defaults keep the app
 * bootable in local/test (health checks simply report `down` when a dependency
 * is unreachable), while production must set real values via the VPS `.env`.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.string().default('postgres://sbs:sbs@localhost:5432/sbs'),
  RABBITMQ_URL: z.string().default('amqp://sbs:sbs@localhost:5672'),
  CORS_ORIGIN: z.string().default('*'),
  // Overrides the auth cookie's Secure flag (default: on in production). Set to
  // 'false' when serving over plain HTTP locally or behind a TLS-terminating proxy.
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  // Auth — production MUST override JWT_SECRET and the admin credentials.
  JWT_SECRET: z.string().min(16).default('dev-insecure-secret-change-me-please'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(1).default('admin12345'),
  ADMIN_NAME: z.string().default('Admin'),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
