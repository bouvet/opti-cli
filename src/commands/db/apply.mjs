"use command";

import { setConnectionString } from "./helpers/connection-string.mjs";
import baseCommand from "./db.mjs";
import { handleAppSettingsFilePathSelect } from "./helpers/appsettings.mjs";

baseCommand
	.command("apply")
	.description("Apply projects current DB connection string to appsettings")
	.action(async () => {
		const selectedAppsettingsPath = await handleAppSettingsFilePathSelect();

		const { CONNECTION_STRING: connectionString } = process.opti.env;

		setConnectionString({
			selectedAppsettingsPath,
			connectionString,
		});
	});
