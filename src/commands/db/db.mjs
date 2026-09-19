"use command";
import path from "node:path";
import program from "#cli";
import { Printer } from "#core/printer.mjs";
import {
	createDockerComposeFile,
	generateDBDockerCompose,
} from "./helpers/docker.mjs";
import {
	connectionString,
	setConnectionString,
} from "./helpers/connection-string.mjs";
import { findAvailablePort } from "./helpers/ports.mjs";
import checkDotnetExists from "#core/prereq/checks/dotnet.mjs";
import checkSqlpackageExists from "#core/prereq/checks/sqlpackage.mjs";
import { bacpac } from "./helpers/bacpac.mjs";
import {
	appsettings,
} from "./helpers/appsettings.mjs";
import { projectConfig } from "#helpers/project-config.mjs";
import { runShellCommand } from "#helpers/shell-command.mjs";
import checkConfigEntriesPresent from "#core/prereq/checks/config-entries-present.mjs";

export const printer = new Printer("db");

const baseCommand = program
	.command("db")
	.description(
		"Configure projects conn. string and create a docker-compse.yml for starting Azure SQL Edge db container and import .bacpac. To get started, create a .bacpac directory in the project root and add your .bacpac files there.",
	);

baseCommand
	.description(
		"Setup docker services for Local MSSQL DB and import a given .bacpac file",
	)
	.option(
		"-p, --port <port>",
		"Specify the port for the database. If no port, it will either default to what the project has used before or find an available one.",
	)
	.option(
		// TODO: remove this option?
		"-n, --name <name>",
		"Specify the name of the azuresql database container (defaults to sqledge-<port>)",
	)
	.prereq([
		checkDotnetExists,
		checkSqlpackageExists,
		checkConfigEntriesPresent(["PROJECT_ROOT_PATH", "OPTI_FOLDER"]),
	])
	.action(async (options) => {
		await handleOptions(options);

		const { port, name } = options;

		printer.group(
			printer.env({
				Port: port,
				"DB name": name,
				Project: path.basename(process.cwd()),
			}),
		);

		const selectedBacpacFilePath = await bacpac.select();

		const selectedAppsettingsPath = await appsettings.select();

		const bacpacFileName = selectedBacpacFilePath.split("/").at(-1);

		const conString = connectionString.create({
			bacpac: bacpacFileName,
			port,
			containerDbName: name,
		});

		setConnectionString({
			selectedAppsettingsPath,
			connectionString: conString,
		});

		const dockerComposeFile = generateDBDockerCompose({
			port,
			name,
		});

		createDockerComposeFile({ dockerComposeFile });

		await setDatabaseProjectConfig({
			port,
			name,
			bacpac: selectedBacpacFilePath,
			connectionString: conString,
		});

		const didImport = await bacpac.import(name);

		printer.success("Database setup successful!");

		if (didImport) {
			printer.neutral("Database is now running");
		} else {
			await runShellCommand("opti db up");
		}

		printer.neutral(
			"Run <opti db start> to start, <opti db stop> to stop it and <opti db kill> to permanently remove it.",
		);
	});

async function handleOptions(options) {
	if (options.port && Number.isNaN(+options.port)) {
		printer.error("Port is not an integer.");
		quit(0);
	}

	if (!options.port) {
		options.port =
			process.opti.env?.DB_PORT ??
			(await findAvailablePort(process.opti.constants.defaultDBPort));
	}

	if (!options.name) {
		options.name = `sqlserver-${options.port}`;
	}
}

/**
 * Create a new projects.json file
 * @param {{ port: string, name: string, bacpac: string, connectionString: string }} param0
 */
async function setDatabaseProjectConfig({
	port,
	name,
	bacpac,
	connectionString,
}) {
	await projectConfig.setValues({
		PROJECT_NAME: path.basename(process.cwd()).toLowerCase().replace(".", "-"),
		BACPAC_PATH: bacpac,
		// @ts-expect-error
		DB_NAME: bacpac.split("/").at(-1).split(".")[0],
		DB_CONTAINER_NAME: name,
		DB_PORT: port,
		CONNECTION_STRING: connectionString,
	});
}

export default baseCommand;
