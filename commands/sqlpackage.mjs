import { runShellCommand } from '../helpers/shell-command.mjs';
import program from '../index.mjs';
import { exec } from 'node:child_process';
import { Printer } from '../utils/printer.mjs';

const printer = new Printer('sqlpackage');
const addToPathCommand = `cat << \EOF >> ~/.zprofile
# Add .NET Core SDK tools
export PATH="$PATH:/Users/$(whoami)/.dotnet/tools"
EOF`;

program
  .command('sqlpackage')
  .description('Install sqlpackage with dotnet cli')
  .option('-u, --uninstall', 'Uninstalls sqlpackage')
  .action(async ({ uninstall }) => {
    if (uninstall) {
      printer.info('Uninstalling sqlpackage...');
      await runShellCommand(
        'dotnet',
        ['tool', 'uninstall', '-g', 'microsoft.sqlpackage'],
        process.cwd()
      );
      process.exit(0);
    }

    printer.info('Installing sqlpackage...');

    await runShellCommand(
      'dotnet',
      ['tool', 'install', '-g', 'microsoft.sqlpackage'],
      process.cwd()
    );

    printer.info('Adding sqlpackage to path...');

    exec(addToPathCommand, (err, stdout, stderror) => {
      if (stderror) {
        console.error('stderror:', stderror);
      }

      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }

      console.log(`${stdout}`);
    });

    printer.done('sqlpackage added!');
    printer.success('Restart shell and run it using <sqlpackage>.');
  });
