'use command';

import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('down')
  .alias('stop')
  .description('Stop the datatbase container stack')
  .action(async () => {
    const { OPTI_FOLDER, PROJECT_NAME } = process.opti.env;

    await runShellCommand(
      `docker compose -p ${PROJECT_NAME} -f ${OPTI_FOLDER}/docker-compose.yml down`
    );
    printer.done('Database is shut down.');
  });
