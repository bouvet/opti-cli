'use command';

import checkConfigEntriesPresent from '#core/prereq/checks/config-entries-present.mjs';
import baseCommand, { printer } from './db.mjs';
import { bacpac } from './helpers/bacpac.mjs';

baseCommand
  .command('import')
  .description(
    'Only run .bacpac import, destroys the existing database and re-imports it'
  )
  .prereq([checkConfigEntriesPresent(["DB_CONTAINER_NAME"])])
  .action(async () => {
    const { DB_CONTAINER_NAME } = process.opti.env;
    await bacpac.import(DB_CONTAINER_NAME);
  });
