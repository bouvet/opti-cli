#!/usr/bin/env node

global.quit = process.exit;

import { Command } from 'commander';
import { Printer } from '#core/printer.mjs';
import registerCommands from '#bin/register-commands.mjs';
import registerEnv from '#bin/register-env.mjs';

const printer = new Printer('opti-cli');
const program = new Command();

/**
 * Handles cli starts
 */
async function start() {
  program
    .name('opti')
    .description('Team Optimizely CLI tools.')
    .version('1.0.0');

  // register all commands in /commands directory
  await registerCommands();

  registerEnv();

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
