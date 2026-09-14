import fs from 'node:fs';
import path from 'path';

const __commandsPath = path.join(process.cwd(), '/src/commands');

/**
 * @param {string} name
 * @returns {string}
 */
const createTemplate = (name) =>
  `'use command'
import program from '#cli';
import { Printer } from '#core/printer.mjs';

const printer = new Printer("${name}")

program
  .command("${name}")
  .description('Generated command')
  .action(() => {
    printer.done("Commands are working! Current working directory:" + process.cwd())
  });
`.trim();

function main() {
  const args = process.argv.slice(2);
  const commandName = args[0];

  if (!commandName || typeof commandName === 'undefined') {
    errorMessage('Command name is not valid!');
    return;
  }

  const template = createTemplate(commandName);

  const commandDir = path.join(__commandsPath, commandName);
  const newCommandPath = path.join(commandDir, `${commandName}.mjs`);

  fs.mkdir(commandDir, { recursive: true }, (err) => {
    if (err) {
      errorMessage(err);
      return;
    }

    fs.writeFile(newCommandPath, template, (err) => {
      if (err) {
        errorMessage(err);
      } else {
        console.log(`✅ Command created successfully!`);
      }
    });
  });
}

/**
 *
 * @param {Error | string} err
 */
function errorMessage(err) {
  console.error('❌ Error creating the command:', err);
}

main();
