import { runShellCommand } from '../../../helpers/shell-command.mjs';

/**
 * @returns {Promise<import("../prereq.service.mjs").PrerequisiteCheckReturns>}
 */
export default async function checkBaseSetup() {
  await runShellCommand('opti', ['init']);
}
