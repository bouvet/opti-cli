'use command';

import baseCommand, { printer } from './db.mjs';
import { handleBacpacImport } from './helpers/bacpac.mjs';

baseCommand
  .command('import')
  .description(
    'Only run .bacpac import, destroys the existing database and re-imports it'
  )
  .action(async () => {
    printer.info('Running only import');
    const { DB_CONTAINER_NAME } = process.opti.projectConfig;
    await handleBacpacImport(DB_CONTAINER_NAME, true);
  });
