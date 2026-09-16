import { getProjectConfig } from '#helpers/project-config.mjs';

export default async function registerEnv() {
  // @ts-ignore
  process.opti = {};

  process.opti = {
    projectConfig: await getProjectConfig(),
    constants: {
      defaultDBPort: 1433,
    },
  };
}
