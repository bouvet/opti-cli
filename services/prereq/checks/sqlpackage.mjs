import { commandExists, runCommand } from '../../../helpers/commands.mjs';
import { confirm } from '@inquirer/prompts';
import { checkFailed } from '../index.mjs';

/**
 * @param {import("../../../utils/logger.mjs").Logger} logger
 * @returns {Promise<import("../index.mjs").RequesiteCheckReturns>}
 */
export default async function checkSqlpackageExists(logger) {
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
      return checkFailed(0);
    }
  }
}
