import path from 'node:path';
import appRoot from 'app-root-path';
import fs from 'node:fs';

const cwd = process.cwd();

export function getProjectConfig() {
  const projectsJsonPath = path.resolve(appRoot.path + '/projects.json');
  const projectsFile = fs.readFileSync(projectsJsonPath, 'utf8');
  const projects = JSON.parse(projectsFile || '{}');
  if (!projects[cwd]) {
    throw new Error('Cant find project config!');
  }
  return projects[cwd];
}

export function createProjectConfig({ port, name, bacpac }) {
  const projectConfig = {
    BACPAC_FILENAME: bacpac,
    DB_NAME: bacpac.split('.')[0],
    APP_NAME: name,
    PORT: port.split(':')[0],
  };

  const projectsJsonPath = path.resolve(appRoot.path + '/projects.json');

  const projectsFile = fs.readFileSync(projectsJsonPath, 'utf8');

  const projects = JSON.parse(projectsFile || '{}');

  projects[cwd] = projectConfig;

  fs.writeFileSync(projectsJsonPath, JSON.stringify(projects, null, 2));
}
