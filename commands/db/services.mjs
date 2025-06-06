import path from 'path';
import { getAppsettingsFilePaths } from '../../helpers/appsettings.mjs';
import { select, confirm } from '@inquirer/prompts';
import { killComposeStack } from '../../helpers/docker.mjs';
import { importBacpac } from '../../services/bacpac.service.mjs';
import { searchFileRecursive } from '../../helpers/files.mjs';
import { printer } from './db.mjs';

export async function handleAppSettingsFilePathSelect() {
  const appsettings = getAppsettingsFilePaths();

  if (!Array.isArray(appsettings)) {
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
  const bacpacFiles = searchFileRecursive(
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
