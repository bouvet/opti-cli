import { commandExists } from '../../../helpers/shell-command.mjs';
import { checkFailed } from '../prereq.service.mjs';

/**
 * @param {import("../../../utils/printer.mjs").Printer} printer
 * @returns {Promise<import("../prereq.service.mjs").PrerequisiteCheckReturns>}
 */
export default async function checkDotnetExists(printer) {
  const dotnetExists = await commandExists('dotnet');

  if (!dotnetExists) {
    printer.error('Missing dotnet runtime.');
    printer.info('Install the dotnet runtime before using this command.');
    printer.neutral(
      'https://learn.microsoft.com/en-us/dotnet/core/install/macos'
    );
    return checkFailed(1);
  }
}
