'use command';

import { getProjectConfig } from '../../helpers/project-config.mjs';
import baseCommand, { printer } from './db.mjs';
import { handleBacpacImport } from './services.mjs';

baseCommand
  .command('import')
  .description(
    'Only run .bacpac import, destroys the existing database and re-imports it'
  )
  .action(async () => {
    printer.info('Running only import');
    const { SQLEDGE_CONTAINER_NAME } = getProjectConfig();
    await handleBacpacImport(SQLEDGE_CONTAINER_NAME, true, true);
  });
