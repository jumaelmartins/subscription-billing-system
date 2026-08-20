import { pino, type Logger } from 'pino';
import { env, isDevelopment } from './config/env';

export const logger: Logger = pino({
  name: 'worker',
  level: env.LOG_LEVEL,
  ...(isDevelopment
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
});
