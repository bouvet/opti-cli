'use command';

import program from '../index.mjs';
import { select } from '@inquirer/prompts';
import fs from 'fs';
import { Printer } from '../utils/printer.mjs';
import { searchFileRecursive } from '../helpers/files.mjs';
import { runShellCommand } from '../helpers/shell-command.mjs';
import { checkPrerequisites } from '../services/prereq/prereq.service.mjs';
import checkDotnetExists from '../services/prereq/checks/dotnet.mjs';
import { ensureDbIsRunning } from './db/services.mjs';
// import { getAppsettingsFilePaths } from '../helpers/appsettings.mjs';

const printer = new Printer('watch');

program
  .command('watch')
  .description('Run dotnet watch with a specific profile from launchsettings')
  .action(async () => {
    await checkPrerequisites([checkDotnetExists]);
    await ensureDbIsRunning();

    // const currentDir = process.cwd();
    const fileName = 'launchSettings.json';

    // find launch settings
    const files = searchFileRecursive(
      process.opti.projectConfig.PROJECT_ROOT_PATH,
      fileName,
      {
        relativePath: true,
      }
    );

    if (!files || !files.length) {
      printer.error(`Could not find file with name ${fileName}`);
      printer.help(
        `Are you sure there is a file named ${fileName} in the current working directory?`
      );
      quit(1);
    }

    let launchSettingsPath;

    if (files.length == 1) {
      launchSettingsPath = files[0];
    }

    if (files.length > 1) {
      launchSettingsPath = await select({
        message: 'What launch setting do you want to use?',
        choices: files.map((file) => ({
          name: file,
          value: file,
        })),
      });
      console.log(
        '🚀 ~ watch.mjs:58 ~ .action ~ launchSettings:',
        launchSettingsPath
      );
    }

    printer.env('launchSetting', launchSettingsPath);

    // Choose profile to run

    let profileToRun;
    const profiles = await readProfiles(launchSettingsPath);

    if (!profiles) {
      printer.error(
        `Could not find any profiles to use with the launch setting ${launchSettingsPath}`
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
  const cmsRootPath =
    process.opti.projectConfig?.APPSETTINGS_PATH?.split('/appsettings')[0] ||
    process.cwd();

  runShellCommand(
    `dotnet`,
    ['watch', `--launch-profile "${profile}"`],
    cmsRootPath
  );
};

const readProfiles = async (filePath) => {
  try {
    const launchSettings = await new Promise((resolve) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return printer.error(err);
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
