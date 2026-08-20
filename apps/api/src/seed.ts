import { seedAdmin } from './modules/auth/admin.seed';
import { sql } from './shared/database/pool';
import { logger } from './shared/logger';

seedAdmin()
  .then(async (result) => {
    logger.info(result, 'seed complete');
    await sql.end({ timeout: 5 });
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error({ err }, 'seed failed');
    await sql.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  });
