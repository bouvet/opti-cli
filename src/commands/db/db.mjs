'use command';
import path from 'node:path';
import program from '#cli';
import { Printer } from '#core/printer.mjs';
import { createProjectConfig } from '#helpers/project-config.mjs';
import {
  createDockerComposeFile,
  generateDBDockerCompose,
} from '#helpers/docker.mjs';
import {
  createConnectionString,
  setConnectionString,
} from '#helpers/connection-string.mjs';
import { findAvailablePort } from '#helpers/ports.mjs';
import { checkPrerequisites } from '#core/prereq/prereq.mjs';
import checkDotnetExists from '#core/prereq/checks/dotnet.mjs';
import checkSqlpackageExists from '#core/prereq/checks/sqlpackage.mjs';
import checkBaseSetup from '#core/prereq/checks/base-setup.mjs';

import {
  handleAppSettingsFilePathSelect,
  handleBacpacFileSelect,
  handleBacpacImport,
} from './services.mjs';

export const printer = new Printer('db');

async function handleOptions(options) {
  if (options.port && Number.isNaN(+options.port)) {
    printer.error('Port is not an integer.');
    quit(1);
  }

  if (!options.port) {
    // check if project config has a port
    // if not, probably a new project, and try to find available port
    // ** this can be handled better, should also check availability of the current project port **
    options.port =
      process.opti.projectConfig?.DB_PORT ??
      (await findAvailablePort(process.opti.constants.defaultDBPort));
  }

  if (!options.name) {
    options.name = `sqlserver-${options.port}`;
  }
}

const baseCommand = program
  .command('db')
  .description(
    'Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container and import .bacpac. To get started, create a .bacpac directory in the project root and add your .bacpac files there.'
  );

baseCommand
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

    await handleOptions(options);

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
      appSettingsPath: selectedAppsettingsPath,
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

export default baseCommand;
