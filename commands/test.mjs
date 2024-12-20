import program from '../index.mjs';
import fs from 'node:fs';
import path from 'node:path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
import appRoot from 'app-root-path';

// Create __dirname equivalent
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// console.log('__dirname:', __dirname);
import { spawn } from 'child_process';

const cwd = process.cwd();

program
  .command('test')
  .description('Test that commands are working')
  .action(async () => {
    const child = spawn(
      'docker',
      ['run', '-it', '--rm', 'markhobson/sqlpackage'],
      {
        stdio: 'inherit', // Attach the child process's stdio to the parent
        shell: true, // Run the command in a shell
      }
    );

    // Handle errors
    child.on('error', (err) => {
      console.error(`Error: ${err.message}`);
    });

    // Detect when the process exits
    child.on('exit', (code) => {
      console.log(`Process exited with code ${code}`);
    });
  });
