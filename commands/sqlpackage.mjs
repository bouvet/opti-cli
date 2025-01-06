import { runCommand } from '../helpers/commands.mjs';
import program from '../index.mjs';
import { exec } from 'node:child_process';
import { Logger } from '../utils/logger.mjs';

const logger = new Logger('sqlpackage');
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
      logger.info('Uninstalling sqlpackage...');
      await runCommand(
        'dotnet',
        ['tool', 'uninstall', '-g', 'microsoft.sqlpackage'],
        process.cwd()
      );
      process.exit(0);
    }

    logger.info('Installing sqlpackage...');

    await runCommand(
      'dotnet',
      ['tool', 'install', '-g', 'microsoft.sqlpackage'],
      process.cwd()
    );

    logger.info('Adding sqlpackage to path...');

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

    logger.done('sqlpackage added!');
    logger.success('Restart shell and run it using <sqlpackage>.');
  });
