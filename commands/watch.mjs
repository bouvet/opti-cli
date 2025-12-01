import program from '../index.mjs';
import { select } from '@inquirer/prompts';
import fs from 'fs';
import { error } from 'console';
import { Printer } from '../utils/printer.mjs';
import { searchFileRecursive } from '../helpers/files.mjs';
import { runShellCommand } from '../helpers/shell-command.mjs';
import { checkPrerequisites } from '../services/prereq/prereq.service.mjs';
import checkDotnetExists from '../services/prereq/checks/dotnet.mjs';

const printer = new Printer('watch');

program
  .command('watch')
  .description('Run dotnet watch with a specific profile from launchsettings')
  .action(async () => {
    await checkPrerequisites([checkDotnetExists]);

    // await ensureDbIsRunng();

    const currentDir = process.cwd();
    const fileName = 'launchSettings.json';

    // find launch settings
    const files = searchFileRecursive(currentDir, fileName, {
      relativePath: true,
    });

    if (!files || !files.length) {
      printer.error(`Could not find file with name ${fileName}`);
      printer.help(
        `Are you sure there is a file named ${fileName} in the current working directory?`
      );
      quit(1);
    }

    let launchSettings;

    if (files.length == 1) {
      launchSettings = files[0];
    }

    if (files.length > 1) {
      launchSettings = await select({
        message: 'What launch setting do you want to use?',
        choices: files.map((file) => ({
          name: file,
          value: file,
        })),
      });
    }

    printer.env('launchSetting', launchSettings);

    // Choose profile to run

    let profileToRun;
    const profiles = await readProfiles(launchSettings);

    if (!profiles) {
      printer.error(
        `Could not find any profiles to use with the launch setting ${launchSettings}`
      );
      quit(1);
    }

    if (profiles.length == 1) {
      profileToRun = profiles[0];
    }

    if (profiles.length > 1) {
      profileToRun = await select({
        message: 'What profile do you want to run?',
        choices: profiles.map((profile) => ({ name: profile, value: profile })),
      });
    }

    printer.done(`Running profile "${profileToRun}"`);

    runProfile(profileToRun);
  });

const runProfile = (profile) => {
  runShellCommand(`dotnet watch --launch-profile "${profile}"`);
};

const readProfiles = async (filePath) => {
  try {
    const launchSettings = await new Promise((resolve) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return printer.error(error);
        }

        resolve(data);
      });
    });

    if (!launchSettings) {
      printer.error('No launchsettings found');
      quit(1);
    }

    const profiles = Object.keys(JSON.parse(launchSettings).profiles);

    if (!profiles) {
      printer.error('No profiles found in launchsettings');
      quit(1);
    }

    return profiles;
  } catch (error) {
    printer.error(error);
    quit(1);
  }
};

async function ensureDbIsRunng() {
  await runShellCommand('opti db up');
  printer.group();
}
