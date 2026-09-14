import {
  commandExists,
  runShellCommand,
} from '#helpers/shell-command.mjs';
import { confirm } from '@inquirer/prompts';
import { checkFailed } from '../prereq.mjs';

/**
 * @param {import("#core/printer.mjs").Printer} printer
 * @returns {Promise<import("../prereq.mjs").PrerequisiteCheckReturns>}
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
