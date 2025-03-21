import { searchFileRecursive } from './files.mjs';

export function getAppsettingsFilePaths() {
  let appsettings = searchFileRecursive(
    process.cwd(),
    'appsettings.Development.json'
  );

  if (!appsettings.length) {
    appsettings = searchFileRecursive(process.cwd(), 'appsettings.json');
  }

  if (appsettings.length === 1) {
    return appsettings[0];
  }

  return appsettings;
}
