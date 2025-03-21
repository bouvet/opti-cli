import { commandExists } from '../../../helpers/commands.mjs';
import { checkFailed } from '../prereq.service.mjs';

/**
 * @param {import("../../../utils/logger.mjs").Logger} logger
 * @returns {Promise<import("../prereq.service.mjs").PrerequisiteCheckReturns>}
 */
export default async function checkDotnetExists(logger) {
  const dotnetExists = await commandExists('dotnet');

  if (!dotnetExists) {
    logger.error('Missing dotnet runtime.');
    logger.info('Install the dotnet runtime before using this command.');
    logger.neutral(
      'https://learn.microsoft.com/en-us/dotnet/core/install/macos'
    );
    return checkFailed(1);
  }
}
