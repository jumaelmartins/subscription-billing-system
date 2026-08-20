import { runMigrations } from './shared/database/migrator';
import { logger } from './shared/logger';

runMigrations()
  .then(() => {
    logger.info('migrations applied');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, 'migration failed');
    process.exit(1);
  });
