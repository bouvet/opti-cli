import fs from 'node:fs';
import path from 'node:path';
import { searchFileRecursive, writeFile } from '../helpers/files.mjs';
import program from '../index.mjs';
import { select, confirm } from '@inquirer/prompts';
import { Logger } from '../utils/logger.mjs';
import { exportBacpac, importBacpac } from '../services/bacpac.service.mjs';
import {
  createProjectConfig,
  getProjectConfig,
} from '../helpers/project-config.mjs';
import {
  createDockerComposeFile,
  generateDockerCompose,
  killComposeStack,
} from '../helpers/docker.mjs';
import { runShellCommand } from '../helpers/shell-command.mjs';
import { checkPrerequisites } from '../services/prereq/prereq.service.mjs';
import checkDotnetExists from '../services/prereq/checks/dotnet.mjs';
import checkSqlpackageExists from '../services/prereq/checks/sqlpackage.mjs';
import {
  createConnectionString,
  setConnectionString,
} from '../helpers/connection-string.mjs';
import { findAvailablePort } from '../helpers/ports.mjs';
import { getAppsettingsFilePaths } from '../helpers/appsettings.mjs';

const logger = new Logger('db');

async function handleBacpacImport(containerDbName, kill, force = false) {
  const doBacpacImport =
    force ||
    (await confirm({
      message: 'Do you want to import the .bacpac now?',
    }));

  if (!doBacpacImport) {
    return;
  }

  const doKill =
    kill ||
    (await confirm({
      message:
        'Delete the existing database and server, if it exists? (required for consecutive imports)',
    }));

  if (doKill) {
    await killComposeStack();
  }

  await importBacpac(containerDbName);
}

async function handleBacpacFileSelect() {
  const bacpacFiles = searchFileRecursive(process.cwd(), '.bacpac', {
    useFileExtension: true,
  });

  if (!bacpacFiles.length) {
    logger.error(
      'No bacpac files found! Are you sure there are any .bacpac files in this project?'
    );
    process.exit(1);
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

async function handleAppSettingsFilePathSelect() {
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

async function handleDBCommandOptions(options) {
  if (options.port && Number.isNaN(+options.port)) {
    logger.error('Port is not an integer, exiting...');
    process.exit(1);
  }

  if (!options.port) {
    const port = await findAvailablePort(1433);
    options.port = `${port}:1433`;
    logger.neutral(`No port passed, use --port to set it. Using ${port}:1433.`);
  }

  if (!options.port.includes(':')) {
    options.port = `${options.port}:1433`;
  }

  if (!options.name) {
    options.name = `sqledge-${options.port.split(':')[0]}`;
    logger.neutral(
      'No azure sql container name included, use --name to set azure sql container name (ex. KS, FF). Using default (sqledge-<port>).'
    );
  }

  logger.group();
}

const dbCommand = program
  .command('db')
  .description(
    'Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container and import .bacpac. To get started, create a .bacpac directory in the project root and add your .bacpac files there.'
  );

dbCommand
  .command('up')
  .alias('start')
  .description(
    'Start the datatbase container stack using <docker compose up> in detached mode'
  )
  .action(async () => {
    await runShellCommand('docker compose up -d');
    logger.done('Database is ready!');
  });

dbCommand
  .command('down')
  .alias('stop')
  .description('Stop the datatbase container stack using <docker compose stop>')
  .action(async () => {
    await runShellCommand('docker compose stop');
    logger.done('Database is shut down.');
  });

dbCommand
  .command('kill')
  .description('Kill the datatbase container stack using <docker compose down>')
  .action(async () => {
    await runShellCommand('docker compose down');
    logger.done('Database is shut down.');
  });

dbCommand
  .command('apply')
  .description('Apply projects current DB connection string to appsettings')
  .action(async () => {
    const selectedAppsettingsPath = await handleAppSettingsFilePathSelect();

    const { CONNECTION_STRING: connectionString } = getProjectConfig();

    setConnectionString({
      selectedAppsettingsPath,
      connectionString,
    });
  });

dbCommand
  .command('import')
  .description(
    'Only run .bacpac import, destroys the existing database and re-imports it'
  )
  .action(async () => {
    logger.info('Running only import');
    const { SQLEDGE_CONTAINER_NAME } = getProjectConfig();
    await handleBacpacImport(SQLEDGE_CONTAINER_NAME, true, true);
  });

dbCommand
  .command('export')
  .description(
    'Export the current database using the projects current connection string'
  )
  .action(async () => {
    logger.info('Running export');
    const { CONNECTION_STRING: connectionString, DB_NAME: dbName } =
      getProjectConfig();

    await exportBacpac({ connectionString, dbName });
  });

dbCommand
  .description(
    'Setup docker services for Azure SQL DB and import a given .bacpac file'
  )
  .option(
    '-p, --port <port>',
    'Specify the port for the database. If no port, it will find a '
  )
  .option(
    '-n, --name <name>',
    'Specify the name of the azuresql database container (defaults to sqledge-<port>)'
  )
  .option('-k, --kill', 'Kill the whole container stack and related database')
  .action(async (options) => {
    await checkPrerequisites([checkDotnetExists, checkSqlpackageExists]);

    await handleDBCommandOptions(options);

    const { port, name, kill } = options;

    logger.group(
      logger.env('Port', port),
      logger.env('DB Name', name),
      logger.env('Project', path.basename(process.cwd())),
      logger.env('cwd', process.cwd())
    );

    const selectedBacpacFilePath = await handleBacpacFileSelect();

    const selectedAppsettingsPath = await handleAppSettingsFilePathSelect();

    const bacpacFileName = selectedBacpacFilePath.split('/').at(-1);

    const connectionString = createConnectionString({
      bacpac: bacpacFileName,
      port,
      containerDbName: name,
    });

    setConnectionString({
      selectedAppsettingsPath,
      connectionString,
    });

    const dockerComposeFile = generateDockerCompose({
      port,
      name,
    });

    createDockerComposeFile({ dockerComposeFile });

    createProjectConfig({
      port,
      name,
      bacpac: selectedBacpacFilePath,
      connectionString,
    });

    await handleBacpacImport(name, kill);

    logger.done('Database is ready!');
    logger.neutral(
      'Database is running in Docker! In the future you can run <opti db up (or start)> in project root to start the database, <opti db down (or stop)> to stop it and <opti db kill> to permanently remove it.'
    );
  });
