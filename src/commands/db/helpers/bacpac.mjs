import { confirm, select } from '@inquirer/prompts';
import { runShellCommand } from '../../../helpers/shell-command.mjs';
import {
  checkIfContainerRunning,
  killComposeStack,
  waitForContainerLogString,
} from './docker.mjs';
import { Printer } from '../../../core/printer.mjs';
import { searchFilesRecursive } from '#helpers/files.mjs';
import { printer } from '../db.mjs';

export const bacpac = {
  handleImport: handleBacpacImport,
  export: exportBacpac,
  import: importBacpac,
  select: handleBacpacFileSelect
}

export async function exportBacpac(
  { connectionString, dbName }
) {
  try {
    const sqlpackageCommand = `/Action:Export /TargetFile:"backup-${dbName}.bacpac" \
      /SourceConnectionString:"${connectionString}"`;

    await runShellCommand('sqlpackage', [sqlpackageCommand]);
  } catch (error) {
    printer.error('Error during exporting of database', error);
    return;
  }

  printer.success('Database exported successfully!');
}

export async function importBacpac(
  azuresqlContainerName
) {
  printer.info('Starting .bacpac import');

  try {
    const isRunning = await checkIfContainerRunning(azuresqlContainerName);

    if (!isRunning) {
      await runShellCommand('opti db up');
      await waitForContainerLogString(
        azuresqlContainerName,
        'Service Broker manager has started.'
      );
    }

    await startImport();
  } catch (error) {
    printer.error('Error during importing of bacpac', error);
    quit(1);
  }
}

async function startImport() {

  const {
    BACPAC_PATH,
    DB_NAME,
    DB_PORT: PORT,
    DB_CONTAINER_NAME,
  } = process.opti.projectConfig;
  const connectionString = `Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${DB_CONTAINER_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
  const sqlpackageCommand = `/Action:Import /SourceFile:"${BACPAC_PATH}" /TargetConnectionString:"${connectionString}"`;

  await runShellCommand('sqlpackage', [sqlpackageCommand], { cwd: process.cwd() });
}

export async function handleBacpacImport(containerDbName) {
  const confirmation = await confirm({
    message: 'Do you want to import the .bacpac now? (this will delete the existing database and all its data)'
  })

  if (!confirmation) {
    return false;
  }

  printer.info('Waiting to start bacpac import...');

  await killComposeStack();

  await importBacpac(containerDbName);

  return true;
}

export async function handleBacpacFileSelect() {
  const bacpacFiles = searchFilesRecursive(
    process.opti.projectConfig.PROJECT_ROOT_PATH + '/.opti/bacpac',
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
      name: filePath.split("/").at(-1),
      value: filePath,
    })),
  });

  return selectedBacpacFile;
}