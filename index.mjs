#!/usr/bin/env node

global.quit = process.exit;

import { Command } from "commander"
import registerCommands from './utils/register-commands.mjs';
import { Printer } from './utils/printer.mjs';

const printer = new Printer('opti-cli');
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
        printer.info('bye! 👋');
    } else {
        // Rethrow unknown errors
        throw error;
    }
});

export default program;
