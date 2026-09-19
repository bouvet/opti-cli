import path from "path";
import { searchFilesRecursive } from "#helpers/files.mjs";
import { select } from "@inquirer/prompts";
import { printer } from "../db.mjs";

export const appsettings = {
	getAppsettingsFilePaths,
	select: handleAppSettingsFilePathSelect,
};

export function getAppsettingsFilePaths() {
	const appsettings = searchFilesRecursive(process.cwd(), "appsettings", {
		ignoreDirectories: [
			".vscode",
			".opti",
			"bin",
			"App_Data",
			"obj",
			"modules",
		],
		fuzzy: true,
	});

	if (appsettings.length === 1) {
		return appsettings[0];
	}

	return appsettings;
}

export async function handleAppSettingsFilePathSelect() {
	const appsettings = getAppsettingsFilePaths();

	if (!Array.isArray(appsettings)) {
		printer.success("/" + appsettings.split("/").slice(-2).join("/"), {
			prefixMessage: "Defaulted to following appsettings.",
			prefixColor: "white",
		});
		return appsettings;
	}

	const selectedAppsettingsPath = await select({
		message: "What appsettings do you want to use?",
		choices: appsettings.map((appsettingsPath) => ({
			name: appsettingsPath.split("/").at(-1),
			value: appsettingsPath,
		})),
	});

	return selectedAppsettingsPath;
}
