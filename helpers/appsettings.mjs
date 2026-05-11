import { searchFilesRecursive } from './files.mjs';

export function getAppsettingsFilePaths() {
  let appsettings = searchFilesRecursive(
    process.cwd(),
    'appsettings.Development.json',
    {
      ignoreDirectories: ['.vscode'],
    }
  );

  if (!appsettings.length) {
    appsettings = searchFilesRecursive(process.cwd(), 'appsettings.json', {
      ignoreDirectories: ['.vscode'],
    });
  }

  if (appsettings.length === 1) {
    return appsettings[0];
  }

  return appsettings;
}
