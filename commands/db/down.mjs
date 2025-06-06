'use command';

import { constants } from '../../helpers/constants.mjs';
import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('down')
  .alias('stop')
  .description('Stop the datatbase container stac')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml down`
    );
    printer.done('Database is shut down.');
  });
