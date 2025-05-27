import fs from 'node:fs';
import path from 'node:path';
import { Printer } from '../utils/printer.mjs';

/**
 * Create a new connection string
 * @param {{ port: string, containerDbName: string, bacpac:string }} param0
 * @returns {string}
 */
export const createConnectionString = ({ port, containerDbName, bacpac }) =>
  `Data Source=localhost,${port};Initial Catalog=${bacpac.split('.')[0]};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${containerDbName};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30`;

/**
 * Create a new entry in the projects.json
 * @param {{ selectedAppsettingsPath: string, connectionString: string }} param0
 * @param {Printer} printer
 * @returns {string}
 */
export function setConnectionString(
  { selectedAppsettingsPath, connectionString },
  printer = new Printer('constr')
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
    printer.error('Could not update appsettings, error:', error.message);
    return;
  }

  printer.success('Updated connection string');
  printer.path(
    'Updated in',
    selectedAppsettingsPath.split(path.basename(process.cwd()))[1]
  );
}
