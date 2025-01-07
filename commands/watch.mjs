import program from '../index.mjs';
import { select } from '@inquirer/prompts';
import fs from 'fs';
import { error } from 'console';
import { Logger } from '../utils/logger.mjs';
import { searchFileRecursive } from '../helpers/files.mjs';
import { runCommand } from '../helpers/commands.mjs';
import checkPrerequisites from '../services/check-prereqs.mjs';

const logger = new Logger('watch');

program
  .command('watch')
  .description('Run dotnet watch with a specific profile from launchsettings')
  .action(async () => {
    await checkPrerequisites('watch');

    const currentDir = process.cwd();
    const fileName = 'launchSettings.json';

    // find launch settings
    const files = searchFileRecursive(currentDir, fileName, {
      relativePath: true,
    });

    if (!files || !files.length) {
      logger.error(`Could not find file with name ${fileName}`);
      logger.help(
        `Are you sure there is a file named ${fileName} in the current working directory?`
      );
      process.exit(1);
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

    logger.env('launchSetting', launchSettings);

    // Choose profile to run

    let profileToRun;
    const profiles = await readProfiles(launchSettings);

    if (!profiles) {
      logger.error(
        `Could not find any profiles to use with the launch setting ${launchSettings}`
      );
      process.exit(1);
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

    logger.done(`Running profile "${profileToRun}"`);

    runProfile(profileToRun);
  });

const runProfile = (profile) => {
  runCommand(`dotnet watch --launch-profile "${profile}"`);
};


const readProfiles = async (filePath) => {
  try {
    const launchSettings = await new Promise((resolve) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return logger.error(error);
        }

        resolve(data);
      });
    });

    if (!launchSettings) {
      logger.error('No launchsettings found');
      process.exit(1);
    }

    const profiles = Object.keys(JSON.parse(launchSettings).profiles);

    if (!profiles) {
      logger.error('No profiles found in launchsettings');
      process.exit(1);
    }

    return profiles;
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
