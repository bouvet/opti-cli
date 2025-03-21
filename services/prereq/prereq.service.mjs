import { Logger } from '../../utils/logger.mjs';

/**
 * @typedef {void} Success
 */

/**
 * @typedef {[false, number]} Fail
 */

/**
 * @typedef {Fail | Success} PrerequisiteCheckReturns
 */

/**
 * @typedef {function(Logger): PrerequisiteCheckReturns | Promise<PrerequisiteCheckReturns>} PrerequisiteCheckFn
 */

/**
 * Ensure a command has the required pre requisutes - if not, exit execution
 * @param {Array<PrerequisiteCheckFn>} preRequesites - an array of functions that either returns checkFailed if failed or nothing if successful
 * @param {Logger} logger -
 */
export async function checkPrerequisites(
  preRequesites,
  logger = new Logger('Prerequisites')
) {
  for (const requesiteCheck of preRequesites) {
    const [checkPassed, exitCode] = (await requesiteCheck(logger)) || [true];

    if (!checkPassed) {
      process.exit(exitCode || 0);
    }
  }
}

/**
 * Helper for signifying a failed check - one can also just return a tuple [boolean, number] in place of this
 * @param {number} [exitCode]
 * @returns {Fail}
 */
export function checkFailed(exitCode = 1) {
  return [false, exitCode];
}
