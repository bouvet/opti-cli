'use command';

import { exportBacpac } from '../../core/bacpac.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('export')
  .description(
    'Export the current database using the projects current connection string'
  )
  .action(async () => {
    printer.info('Running export');
    const { CONNECTION_STRING: connectionString, DB_NAME: dbName } =
      process.opti.projectConfig;

    await exportBacpac({ connectionString, dbName });
  });
