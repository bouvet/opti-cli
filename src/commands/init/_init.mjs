import {
  appendFile,
  createDir,
  getFile,
  listDir,
  writeFile,
} from '#helpers/files.mjs';
import { Printer } from '#core/printer.mjs';

const cwd = process.cwd();
const printer = new Printer('init');


export function optiInitCommand() {
  const missingOptiFolder = listDir(cwd + '/.opti')[0] !== null;
  const missingBacpacFolder = listDir(cwd + '/.opti/bacpac')[0] !== null;
  const missingProjectsConfig = getFile('.opti', 'project.json')[0] !== null;
  const gitignore = getFile(
    '',
    '.gitignore'
  )[1];
  const missingGitignore = !gitignore;

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

  setProjectsRootPath();
}

function setProjectsRootPath() {
  const [, content] = getFile('.opti', 'project.json');
  const config = content ? JSON.parse(content) : {};

  if (!config.PROJECT_ROOT_PATH) {
    config.PROJECT_ROOT_PATH = cwd;
    writeFile('/.opti', 'project.json', JSON.stringify(config, null, 2));
    printer.info('Set PROJECT_ROOT_PATH in project.json');
  }
}
