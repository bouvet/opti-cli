import { spawn } from 'child_process';
import { log } from '../utils/logger.mjs';
import path from 'node:path';
import { runCommand } from './commands.mjs';

export async function checkLogsForString(azSqlDbName, searchString) {
  return new Promise((resolve, reject) => {
    const logs = spawn('docker', ['logs', '-f', azSqlDbName]);

    logs.stdout.on('data', (data) => {
      const logOutput = data.toString();

      if (logOutput.includes(searchString)) {
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
  composeStackName = path.basename(process.cwd())
) {
  await runCommand('docker compose', [
    '-p',
    composeStackName,
    'down',
    process.cwd(),
  ]);
  log.info(`Container stack ${composeStackName} killed`);
}
