import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Checks if a given port is available
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export async function isPortAvailable(port) {
  try {
    const containerIds = (await execAsync('docker ps -a -q')).stdout
      .trim()
      .split('\n')
      .filter(Boolean);

    if (!containerIds.length) return true;

    const containersInfo = JSON.parse(
      (await execAsync(`docker inspect ${containerIds.join(' ')}`)).stdout
    );

    return containersInfo.every((container) => {
      const portBindings = container?.HostConfig?.PortBindings || {};
      const portIsAvailable = Object.values(portBindings).every((bindings) =>
        bindings.every((binding) => binding.HostPort !== String(port))
      );
      return portIsAvailable;
    });
  } catch (err) {
    console.error(`Error checking port availability for port ${port}:`, err);
    return true; // Assume port is available on error
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
