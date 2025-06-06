'use command';

import { setConnectionString } from '../../helpers/connection-string.mjs';
import { getProjectConfig } from '../../helpers/project-config.mjs';
import baseCommand from './db.mjs';
import { handleAppSettingsFilePathSelect } from './services.mjs';

baseCommand
  .command('apply')
  .description('Apply projects current DB connection string to appsettings')
  .action(async () => {
    const selectedAppsettingsPath = await handleAppSettingsFilePathSelect();

    const { CONNECTION_STRING: connectionString } = getProjectConfig();

    setConnectionString({
      selectedAppsettingsPath,
      connectionString,
    });
  });
