import { spawn } from 'child_process';

export function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit', // Use 'inherit' to attach stdio to the parent
      shell: true, // Run the command in a shell
      cwd, // Optional: Set a specific working directory
    });

    child.on('error', (err) => {
      reject(`Error: ${err.message}`);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Run command exited with code ${code}`);
      }
    });
  });
}
