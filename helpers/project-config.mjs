import path from 'node:path';
import appRoot from 'app-root-path';
import fs from 'node:fs';
import { Printer } from '../utils/printer.mjs';

const printer = new Printer('Project config');
const projectsJsonPath = path.resolve(appRoot.path + '/projects.json');
const cwd = process.cwd();

/**
 * @typedef {{ BACPAC_PATH: string, DB_NAME: string, SQLEDGE_CONTAINER_NAME: string, PORT: string, CONNECTION_STRING: string }} ProjectConfig
 */

export function getProjectConfigFile() {
  ensureProjectConfigExist();
  return fs.readFileSync(projectsJsonPath, 'utf8');
}

/**
 * Gets the current working projects projects.json entry
 * @returns {ProjectConfig}
 */
export function getProjectConfig() {
  const projectsFile = getProjectConfigFile();
  const projects = JSON.parse(projectsFile || '{}');
  if (!projects[cwd]) {
    printer.error('Cannot find the given projects config entry!');

    printer.help(
      'Have you ran the general setup using <opti db> in the root of the project?'
    );
    quit(1);
  }
  return projects[cwd];
}

/**
 * Create a new project entry in the projects.json file
 * @param {{ port: string, name: string, bacpac: string, connectionString: string }} param0
 */
export function createProjectConfig({ port, name, bacpac, connectionString }) {
  const projectConfig = {
    BACPAC_PATH: bacpac,
    DB_NAME: bacpac.split('/').at(-1).split('.')[0],
    SQLEDGE_CONTAINER_NAME: name,
    PORT: port,
    CONNECTION_STRING: connectionString,
  };

  const projectsFile = getProjectConfigFile();

  const projects = JSON.parse(projectsFile || '{}');

  projects[cwd] = projectConfig;

  fs.writeFileSync(projectsJsonPath, JSON.stringify(projects, null, 2));
}

export function ensureProjectConfigExist() {
  if (!fs.existsSync(projectsJsonPath)) {
    fs.writeFileSync(projectsJsonPath, '');
  }
}
