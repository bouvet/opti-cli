import { commandExists, runCommand } from '../helpers/commands.mjs';
import { Logger } from '../utils/logger.mjs';
import { confirm } from '@inquirer/prompts';
/**
 *
 * @param {string} command
 */
export default async function checkPrerequisites(
  command,
  logger = new Logger('Prerequisites')
) {
  switch (command) {
    case 'db':
      const dotnetExists = await commandExists('dotnet');
      const sqlpackageExists = await commandExists('sqlpackage');

      if (!dotnetExists) {
        logger.error('Missing dotnet runtime.');
        logger.info('Install the dotnet runtime before using this command.');
        logger.neutral(
          'https://learn.microsoft.com/en-us/dotnet/core/install/macos'
        );
        process.exit(1);
      }

      if (!sqlpackageExists) {
        logger.info('The sqlpackage cli is required to use this command');
        const installSqlPackage = await confirm({
          message: 'Install sqlpackage?',
        });
        if (installSqlPackage) {
          await runCommand('opti', ['sqlpackage']);
        } else {
          logger.info('Can not continue without sqlpackage, exiting...');
          process.exit(0);
        }
      }
      break;

    default:
      break;
  }
}
