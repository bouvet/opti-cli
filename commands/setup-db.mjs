import { getFile, listDir, writeFile } from '../helpers/files.mjs';
import program from '../index.mjs';
import { select, confirm } from '@inquirer/prompts';
import { log } from '../utils/logger.mjs';

// dotnet tool install -g microsoft.sqlpackage - trenger denne for å importere bacpac og snakke med db
// sqlpackage command som tilsynelatende funker:
//   sqlpackage /Action:Import /SourceFile:"./Clinic.bacpac"  /TargetConnectionString:"Data Source=localhost,1433;Initial Catalog=northwind;User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=sqledge1;Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30"

const bacpacPath = '.bacpac';
const appsettingsFile = 'appsettings.Development.json';
const getConnectionString = (
  { port, name: appName, bacpac } = {
    port: '1433:1433',
    name: 'sqledge',
    bacpac: '',
  }
) =>
  `Data Source=localhost,${port.split(':')[0]};Initial Catalog=${bacpac.split('.')[0]};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${appName};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;

function setProjectConnectionString(args) {
  try {
    const [, appsettingsRaw] = getFile('/', appsettingsFile);

    const appsettings = JSON.parse(appsettingsRaw);

    appsettings['ConnectionStrings']['EPiServerDB'] = getConnectionString(args);

    writeFile('', appsettingsFile, JSON.stringify(appsettings, null, 2));
  } catch (error) {
    log.error('Could not update appsettings, error:', error.message);
    return;
  }

  log.success('Connection string updated in appsettings.Development.json.');
}

function createDockerComposeFile(args) {
  const { port, name, bacpac } = args;

  const dockerCompose = `
#[bacpac]{ "BACPAC_FILENAME":"${bacpac}", "DB_NAME":"${bacpac.split('.')[0]}", "APP_NAME": "${name}" , "PORT":"${port.split(':')[0]}"}
  
version: '3.8'

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
    throw new Error('Could not create docker-compose.yml');
  }

  log.success('Created docker-compose.yml file.');
}

program
  .command('setup-db')
  .description(
    'Fire up a local Azure db container to use as database for local projects. Also updates connection string and adds a docker-compose.yml.'
  )
  .option(
    '-p, --port <port>',
    'Specify the port for the database (defaults to 1433:1433)'
  )
  .option(
    '-n, --name <name>',
    'Specify the name of the database (defaults to sqledge)'
  )
  .action(async (options) => {
    if (!options.port) {
      options.port = '1433:1433';
      log.neutral('No port passed, using default 1433:1433.');
    }

    if (!options.port.includes(':')) {
      options.port = `${options.port}:1433`;
    }

    if (!options.name) {
      log.error(
        'No app name included, use --name to set app name (ex. KS, FF)'
      );
      return;
    }

    const { port, name } = options;

    log.neutral(`Using port ${port}`);
    log.neutral(`Using name ${name}`);

    const [bacpacError, bacpacFilesRaw] = listDir(bacpacPath);

    if (bacpacError) {
      log.error(
        'Something went wrong fetching bacpac files, error: ',
        bacpacError.message
      );
      log.help(
        'Are you sure there is a /.bacpac/ directory containing .bacpac files in your project? '
      );
      return;
    }

    const bacpacFiles = bacpacFilesRaw.filter((f) => f.endsWith('.bacpac'));

    if (!bacpacFiles || !bacpacFiles.length) {
      log.error(
        'No bacpac files found! Make sure you have a /.bacpac/ directory containing your bacpac files in the root of the project.'
      );
      return;
    }

    const selectedBacpacFile = await select({
      message: 'What .bacpac do you want to use?',
      choices: bacpacFiles.map((file) => ({ name: file, value: file })),
    });

    const setConString = await confirm({
      message:
        'Set appsettings.Development.json connection string? (EPiServerDB)',
    });

    if (setConString) {
      setProjectConnectionString({ bacpac: selectedBacpacFile, port, name });
    }

    createDockerComposeFile({ port, name, bacpac: selectedBacpacFile });

    log.info(
      'Done! Use "docker-compose up" in root of project to start the database.'
    );
    log.info(
      'Run "opti bacpac" in project root to get sqlpackage command to import .bacpac file'
    );
  });
