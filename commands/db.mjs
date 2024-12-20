import { listDir, searchFileRecursive, writeFile } from '../helpers/files.mjs';
import program from '../index.mjs';
import { select, confirm } from '@inquirer/prompts';
import { log } from '../utils/logger.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'child_process';
import { importBacpac } from '../services/import-bacpac.service.mjs';
import { createProjectConfig } from '../helpers/project-config.mjs';
import { runCommand } from '../helpers/commands.mjs';
import { killComposeStack } from '../helpers/docker.mjs';

const cwd = process.cwd();

const getConnectionString = ({ port, name: appName, bacpac }) =>
  `Data Source=localhost,${port.split(':')[0]};Initial Catalog=${bacpac.split('.')[0]};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${appName};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;

function setProjectConnectionString(args) {
  const { selectedAppsettingsPath } = args;

  try {
    const appsettingsRaw = fs.readFileSync(selectedAppsettingsPath, 'utf-8');

    const appsettings = JSON.parse(appsettingsRaw);

    appsettings['ConnectionStrings']['EPiServerDB'] = getConnectionString(args);

    fs.writeFileSync(
      selectedAppsettingsPath,
      JSON.stringify(appsettings, null, 2),
      'utf-8'
    );
  } catch (error) {
    log.error('Could not update appsettings, error:', error.message);
    return;
  }

  log.success('Connection string updated in appsettings.Development.json.');
}

function createDockerComposeFile(args) {
  const { port, name } = args;

  const dockerCompose = `
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
    log.error(
      'Something went wrong creating docker-compose.yml, error:',
      error.message
    );
    throw error;
  }

  log.success('Created docker-compose.yml file.');
}

async function handleOptions(options) {
  if (!options.port) {
    options.port = '1433:1433';
    log.neutral(
      'No port passed, use --port to set it. Using default (1433:1433).'
    );
  }

  if (!options.port.includes(':')) {
    options.port = `${options.port}:1433`;
  }

  if (!options.name) {
    options.name = `sqledge-${options.port.split(':')[0]}`;
    log.neutral(
      'No app name included, use --name to set app name (ex. KS, FF). Using default (sqledge-<port>).'
    );
  }

  if (options.import) {
    log.info('Running only import');
    await importBacpac(options.name);
    process.exit(0);
  }

  if (options.kill) {
    await killComposeStack();
  }
}

async function handleBacpacImport(name) {
  const doBacpacImport = await confirm({
    message: 'Do you want to import the .bacpac now?',
  });

  if (doBacpacImport) {
    await importBacpac(name);
  }
}

async function handleBacpacFile() {
  const [bacpacError, bacpacFilesRaw] = listDir('.bacpac');

  if (bacpacError) {
    log.error(
      'Something went wrong fetching bacpac files, error: ',
      bacpacError.message
    );
    log.help(
      'Are you sure there is a /.bacpac/ directory containing .bacpac files in your project? '
    );
    process.exit(1);
  }

  const bacpacFiles = bacpacFilesRaw.filter((f) => f.endsWith('.bacpac'));

  if (!bacpacFiles || !bacpacFiles.length) {
    log.error(
      'No bacpac files found! Make sure you have a /.bacpac/ directory containing your bacpac files in the root of the project.'
    );
    process.exit(1);
  }

  const selectedBacpacFile = await select({
    message: 'What .bacpac do you want to use?',
    choices: bacpacFiles.map((file) => ({ name: file, value: file })),
  });

  return selectedBacpacFile;
}

async function handleAppSettings() {
  const appsettings = searchFileRecursive(
    process.cwd(),
    'appsettings.Development.json'
  );

  const selectedAppsettingsPath = await select({
    message: 'What appsettings path do you want to use?',
    choices: appsettings.map((file) => ({ name: file, value: file })),
  });

  return selectedAppsettingsPath;
}

program
  .command('db')
  .description(
    'Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container, and import .bacpac.'
  )
  .option(
    '-p, --port <port>',
    'Specify the port for the database (defaults to 1433:1433)'
  )
  .option(
    '-n, --name <name>',
    'Specify the name of the database (defaults to sqledge)'
  )
  .option('-i, --import', 'Only run .bacpac import')
  .option('-k, --kill', 'Kill the whole container stack and related database')
  .action(async (options) => {
    await handleOptions(options);

    const { port, name } = options;

    log.neutral(`Using port <${port}>`);
    log.neutral(`Using name <${name}>`);

    const selectedBacpacFile = await handleBacpacFile();

    const selectedAppsettingsPath = await handleAppSettings();

    setProjectConnectionString({
      bacpac: selectedBacpacFile,
      port,
      name,
      selectedAppsettingsPath,
    });

    createDockerComposeFile({ port, name, bacpac: selectedBacpacFile });

    createProjectConfig({ port, name, bacpac: selectedBacpacFile });

    await handleBacpacImport(name);

    log.info(
      'Done! Use "docker-compose up" in root of project to start the database.'
    );
  });
