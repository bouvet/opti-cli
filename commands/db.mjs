import path from 'node:path';
import { searchFileRecursive } from '../helpers/files.mjs';
import program from '../index.mjs';
import { select, confirm } from '@inquirer/prompts';
import { Printer } from '../utils/printer.mjs';
import { exportBacpac, importBacpac } from '../services/bacpac.service.mjs';
import {
  createProjectConfig,
  getProjectConfig,
} from '../helpers/project-config.mjs';
import {
  createDockerComposeFile,
  generateDBDockerCompose,
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
import checkBaseSetup from '../services/prereq/checks/base-setup.mjs';
import { constants } from '../helpers/constants.mjs';

const __defaultPort = 1433;

const printer = new Printer('db');

async function handleBacpacImport(containerDbName, kill, force = false) {
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

async function handleBacpacFileSelect() {
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
    printer.error('Port is not an integer.');
    quit(1);
  }

  if (!options.port) {
    // check if project config has a port
    // if not, probably a new project, and try to find available port
    options.port =
      getProjectConfig()['PORT'] ?? (await findAvailablePort(__defaultPort));
  }

  if (!options.name) {
    options.name = `sqlserver-${options.port}`;
  }
}

const dbCommand = program
  .command('db')
  .description(
    'Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container and import .bacpac. To get started, create a .bacpac directory in the project root and add your .bacpac files there.'
  );

dbCommand
  .description(
    'Setup docker services for Azure SQL DB and import a given .bacpac file'
  )
  .option(
    '-p, --port <port>',
    'Specify the port for the database. If no port, it will either default to what the project has used before or find an available one.'
  )
  .option(
    '-n, --name <name>',
    'Specify the name of the azuresql database container (defaults to sqledge-<port>)'
  )
  .option('-k, --kill', 'Kill the whole container stack and related database')
  .action(async (options) => {
    await checkPrerequisites([
      checkDotnetExists,
      checkSqlpackageExists,
      checkBaseSetup,
    ]);

    await handleDBCommandOptions(options);

    const { port, name, kill } = options;

    printer.group(
      printer.env('Port', port),
      printer.env('DB Name', name),
      printer.env('Project', path.basename(process.cwd())),
      printer.env('cwd', process.cwd())
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

    const dockerComposeFile = generateDBDockerCompose({
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

    const didImport = await handleBacpacImport(name, kill);

    printer.done('Database is ready!');

    if (didImport) {
      printer.neutral(
        'Database is running in Docker! In the future you can run <opti db up (or start)> in project root to start the database, <opti db down (or stop)> to stop it and <opti db kill> to permanently remove it.'
      );
    } else {
      printer.neutral(
        'Run <opti db up (or start)> in project root to start the database container, <opti db down (or stop)> to stop it and <opti db kill> to permanently remove it.'
      );
    }
  });

dbCommand
  .command('up')
  .alias('start')
  .description('Start the datatbase container stack')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml up -d`
    );
    printer.done('Database is ready!');
  });

dbCommand
  .command('down')
  .alias('stop')
  .description('Stop the datatbase container stac')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml down`
    );
    printer.done('Database is shut down.');
  });

dbCommand
  .command('kill')
  .description('Permanently remove the datatbase container stack')
  .action(async () => {
    await runShellCommand(
      `docker compose -p ${constants.projectName} -f ./.opti/docker-compose.yml down --rmi all --volumes`
    );
    printer.done('Database permanently removed.');
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
    printer.info('Running only import');
    const { SQLEDGE_CONTAINER_NAME } = getProjectConfig();
    await handleBacpacImport(SQLEDGE_CONTAINER_NAME, true, true);
  });

dbCommand
  .command('export')
  .description(
    'Export the current database using the projects current connection string'
  )
  .action(async () => {
    printer.info('Running export');
    const { CONNECTION_STRING: connectionString, DB_NAME: dbName } =
      getProjectConfig();

    await exportBacpac({ connectionString, dbName });
  });
