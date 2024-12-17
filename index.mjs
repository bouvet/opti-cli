#!/usr/bin/env node

import { Command } from 'commander';
import registerCommands from './helpers/register-commands.mjs';

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

export default program;
