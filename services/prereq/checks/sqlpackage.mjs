import {
  commandExists,
  runShellCommand,
} from '../../../helpers/shell-command.mjs';
import { confirm } from '@inquirer/prompts';
import { checkFailed } from '../prereq.service.mjs';

/**
 * @param {import("../../../utils/printer.mjs").Printer} printer
 * @returns {Promise<import("../prereq.service.mjs").PrerequisiteCheckReturns>}
 */
export default async function checkSqlpackageExists(printer) {
  const sqlpackageExists = await commandExists('sqlpackage');

  if (!sqlpackageExists) {
    printer.info('The sqlpackage cli is required to use this command');
    const installSqlPackage = await confirm({
      message: 'Install sqlpackage?',
    });
    if (installSqlPackage) {
      await runShellCommand('opti', ['sqlpackage']);
    } else {
      printer.info('Can not continue without sqlpackage, exiting...');
      return checkFailed(0);
    }
  }
}
