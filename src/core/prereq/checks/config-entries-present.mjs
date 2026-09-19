import { checkFailed } from '../prereq.mjs';

/**
 * Ensures the given keys are present in the project configuration
 * @param {Array<keyof ProjectConfig>} configKeys
 */
export default function checkConfigEntriesPresent(configKeys) {

  /**
   * @param {import("#core/printer.mjs").Printer} printer
   */
  return function (printer) {
    const config = process.opti.env ?? {};

    const missingKeys = configKeys.filter(
      (configKey) => !config[configKey]
    );

    if (missingKeys.length > 0) {
      printer.error(`Missing entries in configuration: ${missingKeys.join(', ')}`);
      printer.help("Try running <opti init> or <opti db>");
      return checkFailed(1);
    }
  }
}