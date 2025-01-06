import path from 'node:path';
import appRoot from 'app-root-path';
import fs from 'node:fs';
import { Logger } from '../utils/logger.mjs';

const logger = new Logger('Project config');

const cwd = process.cwd();

export function getProjectConfig() {
  const projectsJsonPath = path.resolve(appRoot.path + '/projects.json');
  const projectsFile = fs.readFileSync(projectsJsonPath, 'utf8');
  const projects = JSON.parse(projectsFile || '{}');
  if (!projects[cwd]) {
    logger.error('Cannot find project config!');

    logger.help(
      'Have you ran the general setup using <opti db> in the root of the project?'
    );
    process.exit(1);
  }
  return projects[cwd];
}

export function createProjectConfig({ port, name, bacpac }) {
  const projectConfig = {
    BACPAC_PATH: bacpac,
    DB_NAME: bacpac.split('/').at(-1).split('.')[0],
    APP_NAME: name,
    PORT: port.split(':')[0],
  };

  const projectsJsonPath = path.resolve(appRoot.path + '/projects.json');

  const projectsFile = fs.readFileSync(projectsJsonPath, 'utf8');

  const projects = JSON.parse(projectsFile || '{}');

  projects[cwd] = projectConfig;

  fs.writeFileSync(projectsJsonPath, JSON.stringify(projects, null, 2));
}
