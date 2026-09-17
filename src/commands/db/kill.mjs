'use command';

import { runShellCommand } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';

baseCommand
  .command('kill')
  .description('Permanently remove the datatbase container stack')
  .action(async () => {
    const { OPTI_FOLDER, PROJECT_NAME } = process.opti.projectConfig;

    await runShellCommand(
      `docker compose -p ${PROJECT_NAME} -f ${OPTI_FOLDER}/docker-compose.yml down --volumes --remove-orphans`
    );
    printer.done('Database permanently removed.');
  });
