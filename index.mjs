#!/usr/bin/env node

import { Command } from 'commander';
import registerCommands from './helpers/register-commands.mjs';
import { Logger } from './utils/logger.mjs';

const logger = new Logger('opti-cli');
const program = new Command();

(async () => {
  program
    .name('opti')
    .description('Team Optimizely CLI tools.')
    .version('1.0.0');

  // register all commands in /commands directory
  await registerCommands();

  program.parse(process.argv);
})();

process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    logger.info('bye! 👋');
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

export default program;
