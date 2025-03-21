import { spawn } from 'child_process';
import { Logger } from '../utils/logger.mjs';
import path from 'node:path';
import { runCommand } from './commands.mjs';
import { writeFile } from '../helpers/files.mjs';

export async function waitForContainerLogString(
  containerName,
  searchString,
  timeoutInSeconds = 30,
  logger = new Logger('Docker')
) {
  const _timeout = setTimeout(() => {
    logger.error(
      'Timeout reached for finding log string',
      new Error(
        `No log string '${searchString}' was found withing ${timeoutInSeconds} seconds`
      )
    );
    process.exit(1);
  }, timeoutInSeconds * 1000);

  return new Promise((resolve, reject) => {
    const logs = spawn('docker', ['logs', '-f', '--tail', '0', containerName]);

    logs.stdout.on('data', (data) => {
      const logOutput = data.toString();
      if (logOutput.includes(searchString)) {
        clearTimeout(_timeout);
        logs.kill('SIGTERM');
        resolve();
      }
    });

    logs.on('exit', (code) => {
      if (code !== 0) {
        reject(`docker logs command failed with exit code ${code}`);
      }
      resolve();
    });
  });
}

export function checkIfContainerRunning(serviceName) {
  return new Promise((resolve, reject) => {
    const dockerPs = spawn('docker', [
      'ps',
      '--filter',
      `name=${serviceName}`,
      '--format',
      '{{.Names}}',
    ]);

    let output = '';

    dockerPs.stdout.on('data', (data) => {
      output += data.toString();
    });

    dockerPs.stderr.on('data', (data) => {
      console.error(`Error in docker ps: ${data.toString()}`);
    });

    dockerPs.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`docker ps failed with code ${code}`));
      }

      if (output.trim()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Kill a given compose stack
 * @param {string} composeStackName - Name of the compose stack, defaults to cwd base path
 */
export async function killComposeStack(
  composeStackName = path.basename(process.cwd()),
  logger = new Logger('Docker')
) {
  logger.info(`Killing compose stack ${composeStackName}...`);
  await runCommand('docker compose', [
    '-p',
    composeStackName,
    'down',
    process.cwd(),
  ]);
  logger.success(`Container stack ${composeStackName} killed`);
}

/**
 * Generate docker-compose.yml file contents for DB
 * @param {{port: string, name: string}} param0
 * @returns {string}
 */
export function generateDockerCompose({ port, name }) {
  return `
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
}

/**
 * Write docker-compose-yml to project root
 * @param {{dockerComposeFile: string}} param0
 * @param {Logger} logger
 */
export function createDockerComposeFile(
  { dockerComposeFile },
  logger = new Logger('docker')
) {
  const [error] = writeFile('', 'docker-compose.yml', dockerComposeFile);

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
