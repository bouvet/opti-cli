import { spawn, spawnSync } from 'child_process';

export const shell = {
  run: runShellCommand,
  commandExists
}

/**
 * 
 * @param {string} command 
 * @param {string[]} [args] 
 * @param {{stdio?: import('child_process').StdioOptions, ignoreFailure?: boolean, cwd?: string}} [options] 
 * @returns 
 */
export function runShellCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args || [], {
      stdio: options?.stdio || 'inherit', // Use 'inherit' to attach stdio to the parent
      shell: true,
      cwd: options?.cwd,
    });

    child.on('error', (err) => {
      if (options?.ignoreFailure) {
        resolve([false, `Error: ${err.message}`])
      }
      reject([false, `Error: ${err.message}`]);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve([true]);
      } else {
        if (options?.ignoreFailure) {
          resolve([false, `Run command exited with code ${code}`]);
        }
        reject([false, `Run command exited with code ${code}`]);
      }
    });
  });
}

export async function commandExists(command) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [command], { encoding: 'utf8' });
  return result.stdout && result.stdout.trim().length > 0;
}
