import fs from 'node:fs';
import path from 'path';

const __commandsPath = path.join(process.cwd(), 'commands');

/**
 * @param {string} name
 * @returns {string}
 */
const createTemplate = (name) =>
  `import program from '../index.mjs';

program
  .command("${name}")
  .description('Generated command')
  .action(() => {
    console.log('Command "${name}" is registered!');
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

  const newCommandPath = path.join(__commandsPath, `${commandName}.mjs`);

  fs.writeFile(newCommandPath, template, (err) => {
    if (err) {
      errorMessage(err);
    } else {
      console.log(`✅ Command created successfully!`);
    }
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
