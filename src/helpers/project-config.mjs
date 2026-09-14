import fs from 'node:fs';
import path from 'node:path';
import registerEnv from '#bin/register-env.mjs';
import { Printer } from '#core/printer.mjs';

const printer = new Printer('Project config');
const cwd = process.cwd();

export const projectConfig = {
  getConfig: getProjectConfig,
  createConfig: createProjectConfig
}



/**
 * Gets the current working projects projects.json entry
 * @returns {ProjectConfig | undefined}
 */
export function getProjectConfig() {
  const projectInfo = findProjectConfigFile();

  if (!projectInfo) {
    printer.info('No config found.');
    return;
  }

  const projectFile = fs.readFileSync(projectInfo.filePath, 'utf8');
  try {
    return JSON.parse(projectFile);
  } catch (error) {
    printer.error('Failed to parse project config file!', error.message);
    quit(1);
  }
}

/**
 * Create a new projects.json file
 * @param {{ port: string, name: string, bacpac: string, connectionString: string }} param0
 */
export function createProjectConfig({ port, name, bacpac, connectionString }) {
  /** @type {ProjectConfig} */
  const projectConfig = {
    PROJECT_ROOT_PATH: cwd,
    PROJECT_NAME: path.basename(process.cwd()).toLowerCase(),
    BACPAC_PATH: bacpac,
    DB_NAME: bacpac.split('/').at(-1).split('.')[0],
    DB_CONTAINER_NAME: name,
    DB_PORT: port,
    CONNECTION_STRING: connectionString,
  };

  const projectsPath = cwd + '/.opti/project.json';

  fs.writeFileSync(projectsPath, JSON.stringify(projectConfig, null, 2));
  registerEnv();
}

export function ensureProjectConfigExist() {
  const projectsPath =
    process.opti.projectConfig.PROJECT_ROOT_PATH + '/.opti/project.json';

  if (!fs.existsSync(projectsPath)) {
    fs.writeFileSync(projectsPath, '');
  }
}


/**
 * Recursively searches for the project.json file by traversing up the directory tree
 * @param {string} startDir - Directory to start searching from
 * @returns {{filePath: string, rootPath: string}|null} - Path to project.json and project root path, or null if not found
 */
function findProjectConfigFile(startDir = cwd) {
  let currentDir = startDir;

  // Traverse up the directory tree
  while (true) {
    const projectFilePath = path.join(currentDir, '.opti', 'project.json');

    if (fs.existsSync(projectFilePath)) {
      return {
        filePath: projectFilePath,
        rootPath: currentDir,
      };
    }

    // Get parent directory
    const parentDir = path.dirname(currentDir);

    // If we're at the root (parent is same as current)
    if (parentDir === currentDir) {
      return null;
    }

    // Move up to parent
    currentDir = parentDir;
  }
}