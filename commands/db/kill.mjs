'use command';

import { constants } from '../../helpers/constants.mjs';
import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('kill')
  .description('Permanently remove the datatbase container stack')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml down --rmi all --volumes`
    );
    printer.done('Database permanently removed.');
  });
