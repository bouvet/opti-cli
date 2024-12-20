import { runCommand } from '../helpers/commands.mjs';
import {
  checkIfContainerRunning,
  checkLogsForString,
} from '../helpers/docker.mjs';
import { getProjectConfig } from '../helpers/project-config.mjs';
import { log } from '../utils/logger.mjs';

export async function importBacpac(name) {
  try {
    const isRunning = await checkIfContainerRunning(name);

    if (!isRunning) {
      log.info('Running docker compose, starting database...');
      await runCommand('docker', ['compose', 'up', '-d'], process.cwd());
      await checkLogsForString(name, 'EdgeTelemetry starting up');
      log.info('DB has started successfully!');
    }

    await startImport();
  } catch (error) {
    console.error('Error during command execution:', error);
  }
}

async function startImport() {
  log.neutral('Reading projects.json...');
  const { BACPAC_FILENAME, DB_NAME, PORT, APP_NAME } = await getProjectConfig();
  const connectionString = `Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${APP_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
  const sqlpackageCommand = `/Action:Import /SourceFile:"./.bacpac/${BACPAC_FILENAME}" /TargetConnectionString:"${connectionString}"`;

  log.info('Starting .bacpac import...');

  await runCommand('sqlpackage', [sqlpackageCommand], process.cwd());

  // await runCommand(
  //   'docker',
  //   [
  //     'run',
  //     '-it',
  //     '--rm',
  //     '-v',
  //     `${process.cwd()}/.bacpac:/data`,
  //     'markhobson/sqlpackage',
  //     sqlpackageCommand,
  //   ],
  //   process.cwd()
  // );
}
