import { checkPrerequisites } from '#core/prereq/prereq.mjs';
import { Command } from 'commander';

/**
 * Builds upon the commander Command class allowing us to extend its functionality and implement our own
 */
export class OptiCliCommand extends Command {
  /**
   * @param {string} [name] 
   */
  constructor(name) {
    super(name)
  }

  /**
   * @param {string} name 
   */
  createCommand(name) {
    return new OptiCliCommand(name);
  }


  /**
   * Adds a custom chained command for checking prerequesites for commands
   * @param {Array<import('#core/prereq/prereq.mjs').PrerequisiteCheckFn>} checks 
   */
  prereq = (checks = []) => {
    this._prereqs = Array.isArray(checks) ? checks : [checks];
    return this;
  };

  async runPrereqs() {
    if (!this._prereqs) return;
    await checkPrerequisites(this._prereqs);
  }
}