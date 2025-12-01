import program from '../index.mjs';
import { Printer } from '../utils/printer.mjs';
import { runShellCommand, commandExists } from '../helpers/shell-command.mjs';

const printer = new Printer('dotnet');

program
  .command('dotnet')
  .description('Install dotnet SDK for a specific version')
  .argument('[version]', 'SDK version to install (e.g. 8.0)', '8.0')
  .option('-u, --uninstall', 'Uninstalls dotnet SDK for given version')
  .action(async (version, { uninstall }) => {
    const brewExists = await commandExists('brew');
    if (!brewExists) {
      printer.error('Homebrew is required to install dotnet SDK');
      printer.neutral('Install homebrew from: https://brew.sh');
      quit(1);
    }

    if (uninstall) {
      printer.info(`Uninstalling dotnet SDK ${version}...`);
      await runShellCommand('brew', [`uninstall dotnet@${version}`]);
      quit(0);
    }

    printer.info(`Installing dotnet SDK ${version}...`);

    try {
      await runShellCommand('brew', [`install dotnet@${version}`]);
      printer.success(`Dotnet SDK ${version} installed successfully!`);

      printer.info('Adding SDK to path...');
      await runShellCommand(
        `echo 'export PATH="/usr/local/share/dotnet:$PATH"' >> ~/.zshrc`
      );

      printer.done('Dotnet SDK installation complete!');
      printer.success('Restart your terminal or run: source ~/.zshrc');
    } catch (error) {
      printer.error('Failed to install dotnet SDK', error);
      quit(1);
    }
  });
