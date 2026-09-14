'use command';

import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('down')
  .alias('stop')
  .description('Stop the datatbase container stac')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${process.opti.projectConfig.PROJECT_NAME} -f ./.opti/docker-compose.yml down`
    );
    printer.done('Database is shut down.');
  });
