import { commandExists, runCommand } from '../helpers/commands.mjs';
import { Logger } from '../utils/logger.mjs';
import { confirm } from '@inquirer/prompts';
/**
 * Check if pre-requisites are in order for a given command
 * @param {string} command
 * @param {Logger} logger
 */
export default async function checkPrerequisites(
  command,
  logger = new Logger('Prerequisites')
) {
  switch (command) {
    case 'db':
      checkDotnetExists(logger);
      checkSqlpackageExists(logger);
      break;

    case 'watch':
      checkDotnetExists(logger);

    default:
      break;
  }
}

/**
 * @param {Logger} logger
 */
async function checkDotnetExists(logger) {
  const dotnetExists = await commandExists('dotnet');

  if (!dotnetExists) {
    logger.error('Missing dotnet runtime.');
    logger.info('Install the dotnet runtime before using this command.');
    logger.neutral(
      'https://learn.microsoft.com/en-us/dotnet/core/install/macos'
    );
    process.exit(1);
  }
}

/**
 * @param {Logger} logger
 */
async function checkSqlpackageExists(logger) {
  const sqlpackageExists = await commandExists('sqlpackage');

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
}
