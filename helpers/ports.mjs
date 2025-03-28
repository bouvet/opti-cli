import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Checks if a given port is available
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export async function isPortAvailable(port) {
  const portStr = String(port);
  try {
    const { stdout } = await execAsync('docker ps -a -q');
    const containerIds = stdout.split('\n').filter((id) => id.trim());
    if (containerIds.length === 0) {
      return true;
    }
    const { stdout: inspectOut } = await execAsync(
      `docker inspect ${containerIds.join(' ')}`
    );
    let containersInfo = JSON.parse(inspectOut);
    for (const container of containersInfo) {
      const portBindings =
        container.HostConfig && container.HostConfig.PortBindings;
      if (portBindings && typeof portBindings === 'object') {
        for (const bindings of Object.values(portBindings)) {
          if (Array.isArray(bindings)) {
            for (const binding of bindings) {
              if (binding.HostPort === portStr) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Error checking port availability:', err);
    return true;
  }
}

/**
 * Checks connection to given port, if it's busy, it adds 1 to the port (ex. 1433 -> 1434)
 * @param {number} startPort
 * @returns {Promise<number>}
 */
export async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}
