import { getProjectConfig } from '../helpers/project-config.mjs';

export function registerEnv() {
  // @ts-ignore
  process.opti = {};

  process.opti = {
    projectConfig: getProjectConfig(),
    constants: {
      defaultDBPort: 1433,
    },
  };
}
