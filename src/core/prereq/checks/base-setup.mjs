import { runShellCommand } from '#helpers/shell-command.mjs';

/**
 * @returns {Promise<import("../prereq.mjs").PrerequisiteCheckReturns>}
 */
export default async function checkBaseSetup() {
  // check if there is an .opti folder by looking backwards from cwd?
  // how bout a command opti setup? Which checks existing stuff etc, and opti init just creates the base .opti setup
  // thinking about it, maybe we should just make sure people run opti setup whereever they want to have their project, and if they havent it just exits?
  // lik ein pnpm/npm, if you run commands without a pckage.json, it just wont work which makes sense?

  // okei så denne gir egentlig ikke mening at eksisterer
  // bedre å force brukeren til å kjøre init/setup der de har lyst til å gjøre det, og så kan vi traverse og se etter .opti mappen?
  // await runShellCommand('opti', ['init']);
}
