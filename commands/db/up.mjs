'use command';

import { constants } from '../../helpers/constants.mjs';
import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('up')
  .alias('start')
  .description('Start the datatbase container stack')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml up -d`
    );
    printer.done('Database is ready!');
  });
