import { Command } from "commander";
import { checkPrerequisites } from "#core/prereq/prereq.mjs";

/**
 * Builds upon the commander Command class allowing us to extend its functionality and implement our own
 */
export class OptiCliCommand extends Command {
	_optiSkipConfig = false;

	/**
	 * @param {string} name
	 */
	createCommand(name) {
		return new OptiCliCommand(name);
	}

	/**
	 * Marks this command as not requiring project config and will skip the config setup prompt.
	 * @returns {this}
	 */
	skipConfig() {
		this._optiSkipConfig = true;
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	doSkipConfigSetup() {
		return this._optiSkipConfig;
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
