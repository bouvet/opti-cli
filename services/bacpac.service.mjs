import { runShellCommand } from '../helpers/shell-command.mjs';
import {
  checkIfContainerRunning,
  waitForContainerLogString,
} from '../helpers/docker.mjs';
import { getProjectConfig } from '../helpers/project-config.mjs';
import { Printer } from '../utils/printer.mjs';

export async function exportBacpac(
  { connectionString, dbName },
  printer = new Printer('import')
) {
  try {
    const sqlpackageCommand = `/Action:Export /TargetFile:"backup-${dbName}.bacpac" \
      /SourceConnectionString:"${connectionString}"`;

    await runShellCommand('sqlpackage', [sqlpackageCommand], process.cwd());
  } catch (error) {
    printer.error('Error during exporting of database', error);
    return;
  }

  printer.success('Database exported successfully!');
}

export async function importBacpac(
  azuresqlContainerName,
  printer = new Printer('import')
) {
  try {
    const isRunning = await checkIfContainerRunning(azuresqlContainerName);

    if (!isRunning) {
      printer.info('Starting database...');
      await runShellCommand('opti db up');
      await waitForContainerLogString(
        azuresqlContainerName,
        'EdgeTelemetry starting up'
      );
      printer.success('Database started successfully!');
    }

    await startImport();
  } catch (error) {
    printer.error('Error during importing of bacpac', error);
    quit(1);
  }
}

async function startImport(printer = new Printer('bacpac')) {
  printer.info('Starting .bacpac import...');

  const { BACPAC_PATH, DB_NAME, PORT, SQLEDGE_CONTAINER_NAME } =
    getProjectConfig();
  const connectionString = `Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${SQLEDGE_CONTAINER_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
  const sqlpackageCommand = `/Action:Import /SourceFile:"${BACPAC_PATH}" /TargetConnectionString:"${connectionString}"`;

  await runShellCommand('sqlpackage', [sqlpackageCommand], process.cwd());
}
