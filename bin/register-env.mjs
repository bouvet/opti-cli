import { getProjectConfig } from '#helpers/project-config.mjs';

export default async function registerEnv() {
  // @ts-ignore
  process.opti = {};

  const config = await getProjectConfig();

  if (!config) {
    quit(0);
  }

  process.opti = {
    env: config,
    constants: {
      defaultDBPort: 1433,
    },
  };
}
