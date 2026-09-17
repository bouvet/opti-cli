import { Printer } from "#core/printer.mjs";
import { runShellCommand } from "./shell-command.mjs";

const printer = new Printer("docker");

export const docker = {
  ensureDbIsRunning
}


async function ensureDbIsRunning() {
  const projectRoot = process.opti.projectConfig?.PROJECT_ROOT_PATH;

  if (!projectRoot) {
    printer.info('No project root path set, run <opti db> to set it.');
    return;
  }

  await runShellCommand('opti', ['db', 'up', '-i'], { cwd: projectRoot, ignoreFailure: true });

  printer.group();
}