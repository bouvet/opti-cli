import { runCommand } from '../helpers/commands.mjs';
import {
  checkIfContainerRunning,
  waitForContainerLogString,
} from '../helpers/docker.mjs';
import { getProjectConfig } from '../helpers/project-config.mjs';
import { Logger } from '../utils/logger.mjs';

export async function importBacpac(name, logger = new Logger('bacpac')) {
  try {
    const isRunning = await checkIfContainerRunning(name);

    if (!isRunning) {
      logger.info('Starting database...');
      await runCommand('docker', ['compose', 'up', '-d'], process.cwd());
      await waitForContainerLogString(name, 'EdgeTelemetry starting up');
      logger.success('Database started successfully!');
    }

    await startImport();
  } catch (error) {
    logger.error(
      'Error during importing of bacpac',
      error,
      'Are you missing the sqlpackage cli? Install it with <opti sqlpackage> (requires dotnet runtime).'
    );
    process.exit(1);
  }
}

async function startImport(logger = new Logger('bacpac')) {
  logger.info('Starting .bacpac import...');

  const { BACPAC_FILENAME, DB_NAME, PORT, APP_NAME } = await getProjectConfig();
  const connectionString = `Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${APP_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
  const sqlpackageCommand = `/Action:Import /SourceFile:"./.bacpac/${BACPAC_FILENAME}" /TargetConnectionString:"${connectionString}"`;

  await runCommand('sqlpackage', [sqlpackageCommand], process.cwd());
}
