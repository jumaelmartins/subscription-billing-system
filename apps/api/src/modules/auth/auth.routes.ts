import type { FastifyInstance } from 'fastify';
import { loginRequestSchema, type AuthUser } from '@sbs/contracts';
import { env, isProduction } from '../../config/env';
import { findUserByEmail, findUserById } from '../users/users.repository';
import { verifyPassword } from './password';

const COOKIE_NAME = 'token';
const EIGHT_HOURS = 60 * 60 * 8;
const COOKIE_SECURE = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProduction;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const parsed = loginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
      }

      const user = await findUserByEmail(parsed.data.email);
      if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
        return reply.code(401).send({ error: 'invalid_credentials' });
      }

      const token = await reply.jwtSign({ sub: user.id, email: user.email, role: user.role });
      reply.setCookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: COOKIE_SECURE,
        maxAge: EIGHT_HOURS,
      });

      const body: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
      return body;
    },
  );

  app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await findUserById(req.user.sub);
    if (!user) {
      return reply.code(404).send({ error: 'not_found' });
    }
    const body: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return body;
  });
}
