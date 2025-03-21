import net from 'node:net';

/**
 * Checks if a given port is available
 * @param {number} port
 * @returns
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Checks connection to given port, if its busy, it adds 1 to the port (ex. 1433 -> 1434)
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
