import path from 'path';
import { getAppsettingsFilePaths } from '../../helpers/appsettings.mjs';
import { select, confirm } from '@inquirer/prompts';
import { killComposeStack } from '../../helpers/docker.mjs';
import { importBacpac } from '../../core/bacpac.mjs';
import { searchFilesRecursive } from '../../helpers/files.mjs';
import { printer } from './db.mjs';
import { runShellCommand } from '../../helpers/shell-command.mjs';

export async function handleAppSettingsFilePathSelect() {
  const appsettings = getAppsettingsFilePaths();

  if (!Array.isArray(appsettings)) {
    printer.success('/' + appsettings.split('/').slice(-2).join('/'), {
      prefixMessage: 'Defaulted to following appsettings.',
      prefixColor: 'white',
    });
    return appsettings;
  }

  const selectedAppsettingsPath = await select({
    message: 'What appsettings do you want to use?',
    choices: appsettings.map((appsettingsPath) => ({
      name: appsettingsPath.split(path.basename(process.cwd()))[1],
      value: appsettingsPath,
    })),
  });

  return selectedAppsettingsPath;
}

export async function handleBacpacImport(containerDbName, kill, force = false) {
  const doBacpacImport =
    force ||
    (await confirm({
      message: 'Do you want to import the .bacpac now?',
    }));

  if (!doBacpacImport) {
    return false;
  }

  const doKill =
    kill ||
    (await confirm({
      message:
        'Delete the existing database and related data, if it exists? (required for consecutive imports)',
    }));

  if (doKill) {
    await killComposeStack();
  }

  await importBacpac(containerDbName);

  return true;
}

export async function handleBacpacFileSelect() {
  const bacpacFiles = searchFilesRecursive(
    process.cwd() + '/.opti/bacpac',
    '.bacpac',
    {
      useFileExtension: true,
    }
  );

  if (!bacpacFiles.length) {
    printer.error('No bacpac files found!');
    printer.help('Are you sure there are any .bacpac files in /.opti/bacpac?');
    quit(1);
  }

  const selectedBacpacFile = await select({
    message: 'What .bacpac do you want to use?',
    choices: bacpacFiles.map((filePath) => ({
      name: filePath.split(process.cwd()).at(-1),
      value: filePath,
    })),
  });

  return selectedBacpacFile;
}

export async function ensureDbIsRunning() {
  const projectRoot = process.opti.projectConfig?.PROJECT_ROOT_PATH;
  console.log(
    '🚀 ~ services.mjs:83 ~ ensureDbIsRunning ~ process.opti.projectConfig:',
    process.opti.projectConfig
  );

  if (!projectRoot) {
    printer.info('No project root path set, run <opti db> to set it.');
    return;
  }

  await runShellCommand('opti', ['db', 'up'], projectRoot);
  printer.group();
}
