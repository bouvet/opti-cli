import { getProjectConfig } from "#helpers/project-config.mjs";

/**
 *
 * @param {{skipConfigSetup?: boolean}} param0
 */
export default async function registerEnv({ skipConfigSetup }) {
	// @ts-expect-error
	process.opti = { skipConfigSetup };

	const config = await getProjectConfig();

	if (!config && !skipConfigSetup) {
		quit(0);
	}

	process.opti = {
		env: config,
		constants: {
			defaultDBPort: 1433,
		},
	};
}
