import fs from 'node:fs';
import { checkFailed } from '../prereq.mjs';

const cwd = process.cwd();

/**
 * Checks for a .csproj file to ensure the command is running in the root of a dotnet project directory
 * @param {import("#core/printer.mjs").Printer} printer
 */
export default function checkIsDotnetProject(printer) {
  const files = fs.readdirSync(cwd);
  const isDotnetProject = files.some((file) =>
    file.endsWith('.csproj') // || file.endsWith('.sln') // .sln files dont signify the correct folder
  );

  if (!isDotnetProject) {
    printer.error('Could not determine that the command is being ran at the root of a dotnet project');
    printer.help('Are you sure you are running this command in the root of the project where the .csproj og .sln file is located?');
    return checkFailed(1);
  }
}