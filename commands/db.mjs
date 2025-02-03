import { searchFileRecursive, writeFile } from '../helpers/files.mjs';
import program from '../index.mjs';
import { select, confirm } from '@inquirer/prompts';
import { Logger } from '../utils/logger.mjs';
import fs from 'node:fs';
import { importBacpac } from '../services/import-bacpac.service.mjs';
import {
  createProjectConfig,
  getProjectConfig,
} from '../helpers/project-config.mjs';
import { killComposeStack } from '../helpers/docker.mjs';
import path from 'node:path';
import { runCommand } from '../helpers/commands.mjs';
import { checkPrerequisites } from '../services/prereq/index.mjs';
import checkDotnetExists from '../services/prereq/checks/dotnet.mjs';
import checkSqlpackageExists from '../services/prereq/checks/sqlpackage.mjs';

const logger = new Logger('db');

const getConnectionString = ({ port, name: appName, bacpac }) =>
  `Data Source=localhost,${port.split(':')[0]};Initial Catalog=${bacpac.split('.')[0]};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${appName};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;

function setProjectConnectionString(args) {
  const { selectedAppsettingsPath, port, name, bacpac } = args;

  try {
    const appsettingsRaw = fs.readFileSync(selectedAppsettingsPath, 'utf-8');

    const appsettings = JSON.parse(appsettingsRaw);

    appsettings['ConnectionStrings']['EPiServerDB'] = getConnectionString({
      port,
      name,
      bacpac,
    });

    fs.writeFileSync(
      selectedAppsettingsPath,
      JSON.stringify(appsettings, null, 2),
      'utf-8'
    );
  } catch (error) {
    logger.error('Could not update appsettings, error:', error.message);
    return;
  }

  logger.success('Updated connection string');
  logger.path(
    'Updated in',
    selectedAppsettingsPath.split(path.basename(process.cwd()))[1]
  );
}

function createDockerComposeFile(args) {
  const { port, name } = args;

  const dockerCompose = `
# This file was generated using the opti cli tool
services:
  sqledge:
    image: mcr.microsoft.com/azure-sql-edge
    container_name: ${name}
    environment:
      - ACCEPT_EULA=1
      - MSSQL_SA_PASSWORD=bigStrongPassword8@
    ports:
      - "${port}"
    cap_add:
      - SYS_PTRACE
    restart: unless-stopped
  `;

  const [error] = writeFile('', 'docker-compose.yml', dockerCompose);

  if (error) {
    logger.error(
      'Something went wrong creating docker-compose.yml, error:',
      error.message
    );
    throw error;
  }

  logger.success('Created docker-compose.yml in project root');
  logger.path('Created in', '/docker-compose.yml');
}

async function handleOptions(options) {
  if (!options.port) {
    options.port = '1433:1433';
    logger.neutral(
      'No port passed, use --port to set it. Using default (1433:1433).'
    );
  }

  if (!options.port.includes(':')) {
    options.port = `${options.port}:1433`;
  }

  if (!options.name) {
    options.name = `sqledge-${options.port.split(':')[0]}`;
    logger.neutral(
      'No app name included, use --name to set app name (ex. KS, FF). Using default (sqledge-<port>).'
    );
  }

  logger.group();
}

async function handleBacpacImport(name, kill, force = false) {
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

  await importBacpac(name);
}

async function handleBacpacFile() {
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

async function handleAppSettings() {
  let appsettings = searchFileRecursive(
    process.cwd(),
    'appsettings.Development.json'
  );

  if (!appsettings.length) {
    appsettings = searchFileRecursive(process.cwd(), 'appsettings.json');
  }

  if (appsettings.length === 1) {
    return appsettings[0];
  }

  const selectedAppsettingsPath = await select({
    message: 'What appsettings path do you want to use?',
    choices: appsettings.map((appsettingsPath) => ({
      name: appsettingsPath.split(path.basename(process.cwd()))[1],
      value: appsettingsPath,
    })),
  });

  return selectedAppsettingsPath;
}

const dbCommand = program
  .command('db')
  .description(
    'Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container, and import .bacpac.'
  );

dbCommand
  .command('up')
  .description(
    'Start the datatbase container stack using <docker compose up> in detached mode'
  )
  .action(async () => {
    await runCommand('docker compose up -d');
    logger.done('Database is ready!');
  });

dbCommand
  .command('down')
  .description('Stop the datatbase container stack using <docker compose up>')
  .action(async () => {
    await runCommand('docker compose down');
    logger.done('Database shut down!');
  });

dbCommand
  .command('apply')
  .description('Apply current config files to appsettings and launchsettings')
  .action(async () => {
    const selectedAppsettingsPath = await handleAppSettings();

    const { DB_NAME, APP_NAME, PORT } = await getProjectConfig();

    setProjectConnectionString({
      selectedAppsettingsPath,
      port: PORT,
      name: APP_NAME,
      bacpac: DB_NAME,
    });
  });

dbCommand
  .command('import')
  .description(
    'Only run .bacpac import, destroys the existing database and re-imports it'
  )
  .action(async () => {
    logger.info('Running only import');
    const { APP_NAME } = getProjectConfig();
    await handleBacpacImport(APP_NAME, true, true);
  });

dbCommand
  .option(
    '-p, --port <port>',
    'Specify the port for the database (defaults to 1433:1433)'
  )
  .option(
    '-n, --name <name>',
    'Specify the name of the database container (defaults to sqledge-<port>)'
  )
  .option('-k, --kill', 'Kill the whole container stack and related database')
  .action(async (options) => {
    await checkPrerequisites([checkDotnetExists, checkSqlpackageExists]);

    await handleOptions(options);

    const { port, name, kill } = options;

    logger.group(
      logger.env('Port', port),
      logger.env('Name', name),
      logger.env('Project', path.basename(process.cwd())),
      logger.env('cwd', process.cwd())
    );

    const selectedBacpacFilePath = await handleBacpacFile();

    const selectedAppsettingsPath = await handleAppSettings();

    const bacpacFileName = selectedBacpacFilePath.split('/').at(-1);

    setProjectConnectionString({
      bacpac: bacpacFileName,
      port,
      name,
      selectedAppsettingsPath,
    });

    createDockerComposeFile({ port, name, bacpac: selectedBacpacFilePath });

    createProjectConfig({ port, name, bacpac: selectedBacpacFilePath });

    await handleBacpacImport(name, kill);

    logger.done('Database is ready!');
    logger.neutral(
      'Run <opti db up> or <docker compose up> in project root to start the database'
    );
  });
