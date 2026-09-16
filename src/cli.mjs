#!/usr/bin/env node

global.quit = process.exit;

import { Printer } from '#core/printer.mjs';
import registerCommands from '#bin/register-commands.mjs';
import registerEnv from '#bin/register-env.mjs';
import { OptiCliCommand } from '#core/opti-cli-command.mjs';



const printer = new Printer('opti-cli');
const program = new OptiCliCommand();

/**
 * Handles the execution and start of the cli
 */
async function start() {
  program
    .name('opti')
    .description('Team Optimizely CLI tools.')
    .version('1.0.0')
    .hook('preAction', async (thisCommand, actionCommand) => {
      const cmd = /** @type {OptiCliCommand} */ (actionCommand);
      if (typeof cmd.runPrereqs === 'function') {
        await cmd.runPrereqs();
      }
    });

  // register all commands in /commands directory
  await registerCommands();

  await registerEnv();
  program.parse(process.argv);
}

/**
 * Execute start
 */
(async () => {
  await start();
})();

/**
 * Handles ending execution
 * @param {any} [error] 
 */
function end(error) {
  if (!error || (error instanceof Error && error.name === 'ExitPromptError')) {
    printer.info('bye! 👋');
  } else {
    // rethrow unknown errors
    throw error;
  }
}

process.on('uncaughtException', (error) => {
  end(error);
});


export default program;
