"use command";

import checkConfigEntriesPresent from "#core/prereq/checks/config-entries-present.mjs";
import { runShellCommand } from "../../helpers/shell-command.mjs";
import baseCommand, { printer } from "./db.mjs";

baseCommand
	.command("up")
	.alias("start")
	.description("Start the datatbase container stack")
	.prereq([checkConfigEntriesPresent(["OPTI_FOLDER", "PROJECT_NAME"])])
	.option("-i, --ignout", "Ignore console logs")
	.action(async (options) => {
		const { ignout } = options;

		if (!ignout) {
			printer.info("Starting database and containers");
		}

		const { OPTI_FOLDER, PROJECT_NAME } = process.opti.env;
		const [success, error] = await runShellCommand(
			`docker compose -p ${PROJECT_NAME} -f ${OPTI_FOLDER}/docker-compose.yml up -d`,
			[],
			{ ignoreFailure: true, stdio: ignout ? "ignore" : "inherit" },
		);

		if (!success) {
			printer.warning("Could not start database", error);
		} else {
			if (!ignout) {
				printer.done("Database started!");
			}
		}
	});
