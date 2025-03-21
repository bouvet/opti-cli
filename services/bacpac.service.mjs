import { runCommand } from '../helpers/commands.mjs';
import {
  checkIfContainerRunning,
  waitForContainerLogString,
} from '../helpers/docker.mjs';
import { getProjectConfig } from '../helpers/project-config.mjs';
import { Logger } from '../utils/logger.mjs';

export async function exportBacpac(
  { connectionString, dbName },
  logger = new Logger('import')
) {
  try {
    const sqlpackageCommand = `/Action:Export /TargetFile:"backup-${dbName}.bacpac" \
      /SourceConnectionString:"${connectionString}"`;

    await runCommand('sqlpackage', [sqlpackageCommand], process.cwd());
  } catch (error) {
    logger.error('Error during exporting of database', error);
    return;
  }

  logger.success('Database exported successfully!');
}

export async function importBacpac(
  azuresqlContainerName,
  logger = new Logger('import')
) {
  try {
    const isRunning = await checkIfContainerRunning(azuresqlContainerName);

    if (!isRunning) {
      logger.info('Starting database...');
      await runCommand('docker', ['compose', 'up', '-d'], process.cwd());
      await waitForContainerLogString(
        azuresqlContainerName,
        'EdgeTelemetry starting up'
      );
      logger.success('Database started successfully!');
    }

    await startImport();
  } catch (error) {
    logger.error('Error during importing of bacpac', error);
    process.exit(1);
  }
}

async function startImport(logger = new Logger('bacpac')) {
  logger.info('Starting .bacpac import...');

  const { BACPAC_PATH, DB_NAME, PORT, SQLEDGE_CONTAINER_NAME } =
    getProjectConfig();
  const connectionString = `Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${SQLEDGE_CONTAINER_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
  const sqlpackageCommand = `/Action:Import /SourceFile:"${BACPAC_PATH}" /TargetConnectionString:"${connectionString}"`;

  await runCommand('sqlpackage', [sqlpackageCommand], process.cwd());
}
