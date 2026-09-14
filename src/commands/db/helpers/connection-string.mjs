import fs from 'node:fs';
import path from 'node:path';
import { printer } from '../db.mjs';

const connectionString = {
  create: createConnectionString,
  set: setConnectionString
}

/**
 * Create a new connection string
 * @param {{ port: string, containerDbName: string, bacpac:string }} param0
 * @returns {string}
 */
export function createConnectionString({ port, containerDbName, bacpac }) {
  return `Data Source=localhost,${port};Initial Catalog=${bacpac.split('.')[0]};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${containerDbName};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;
}

/**
 * Create a new entry in the projects.json
 * @param {{ selectedAppsettingsPath: string, connectionString: string }} param0
 */
export function setConnectionString(
  { selectedAppsettingsPath, connectionString }
) {
  try {
    const appsettingsRaw = fs.readFileSync(selectedAppsettingsPath, 'utf-8');

    const appsettings = JSON.parse(appsettingsRaw);

    appsettings['ConnectionStrings']['EPiServerDB'] = connectionString;

    fs.writeFileSync(
      selectedAppsettingsPath,
      JSON.stringify(appsettings, null, 2),
      'utf-8'
    );
  } catch (error) {
    // TODO: better error handling
    printer.error('Could not update appsettings, error:', error.message);
    return;
  }

  printer.success('Updated connection string');

  printer.path(
    'Updated in',
    selectedAppsettingsPath.split(path.basename(process.cwd()))[1]
  );
}
