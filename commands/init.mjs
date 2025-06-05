import {
  appendFile,
  createDir,
  getFile,
  listDir,
  writeFile,
} from '../helpers/files.mjs';
import program from '../index.mjs';
import { Printer } from '../utils/printer.mjs';

const cwd = process.cwd();
const printer = new Printer('init');

program
  .command('init')
  .description('Basic setup for using opti cli')
  .action(() => {
    const missingOptiFolder = listDir(cwd + '/.opti')[0] !== null;
    const missingBacpacFolder = listDir(cwd + '/.opti/bacpac')[0] !== null;
    const missingProjectsConfig = getFile('.opti', 'project.json')[0] !== null;
    const /** @type {string | undefined}*/ gitignore = getFile(
        '',
        '.gitignore'
      )[1];
    const missingGitignore = gitignore === undefined;

    if (
      !missingOptiFolder &&
      !missingBacpacFolder &&
      !missingProjectsConfig &&
      !missingGitignore
    ) {
      return;
    }

    if (missingOptiFolder) {
      createDir(cwd + '/.opti');
      printer.info('Created .opti directory in app root');
    }

    if (missingBacpacFolder) {
      createDir(cwd + '/.opti/bacpac');
      printer.info('Created bacpac directory');
    }

    if (missingProjectsConfig) {
      writeFile('/.opti', 'project.json', JSON.stringify({}));
      printer.info('Created project.json config file');
    }

    if (missingGitignore) {
      printer.neutral(
        'Missing .gitignore file in project, skipping updating gitignore.'
      );
    } else {
      if (!gitignore.includes('.opti')) {
        appendFile('', '.gitignore', '\n.opti');
        printer.info('Updated .gitignore to exclude .opti');
      }
    }
  });
