"use command";

import fs from "node:fs";
import { select } from "@inquirer/prompts";
import program from "#cli";
import checkDotnetExists from "#core/prereq/checks/dotnet.mjs";
import { Printer } from "#core/printer.mjs";
import { docker } from "#helpers/docker.mjs";
import { searchFilesRecursive } from "#helpers/files.mjs";
import { projectConfig } from "#helpers/project-config.mjs";
import { runShellCommand } from "#helpers/shell-command.mjs";

const printer = new Printer("watch");

program
	.command("watch")
	.description("Run dotnet watch with a specific profile from launchsettings")
	.prereq([checkDotnetExists])
	.option(
		"-p --profile <profile>",
		"Explicityly run this launch profile, bypassing profile/default selection prompts",
	)
	.option(
		"-d --default",
		"Prompt for a profile and save the selection as the new default for future runs",
	)
	.action(async (options) => {
		const { profile, default: defaultProfile } = options;

		await docker.ensureDbIsRunning();

		// const currentDir = process.cwd();
		const launchSettingsFileName = "launchSettings.json";

		// find launch settings
		const files = searchFilesRecursive(
			process.opti.env?.PROJECT_ROOT_PATH || process.cwd(),
			launchSettingsFileName,
			{
				relativePath: true,
			},
		);

		if (!files?.length) {
			printer.error(`Could not find file with name ${launchSettingsFileName}`);
			printer.help(
				`Are you sure there is a file named ${launchSettingsFileName} in the current working directory?`,
			);
			quit(1);
		}

		let launchSettingsPath;

		if (files.length === 1) {
			launchSettingsPath = files[0];
		}

		if (files.length > 1) {
			launchSettingsPath = await select({
				message: "What launch setting do you want to use?",
				choices: files.map((file) => ({
					name: file,
					value: file,
				})),
			});
		}

		let profileToRun;
		const profiles = await readProfiles(launchSettingsPath);

		if (profile) {
			executeRunProfile(profile, launchSettingsPath);
			return;
		}

		const existingDefaultProfile = process.opti.env.DEFAULT_PROFILE;
		const runDefault = existingDefaultProfile && !defaultProfile;

		if (runDefault) {
			executeRunProfile(existingDefaultProfile, launchSettingsPath);
			return;
		}

		if (!profiles) {
			printer.error(
				`Could not find any profiles to use with the launch setting ${launchSettingsPath}`,
			);
			return;
		}

		if (profiles.length === 1) {
			profileToRun = profiles[0];
		}

		if (profiles.length > 1) {
			profileToRun = await select({
				message: "What profile do you want to run?",
				choices: profiles.map((profile) => ({ name: profile, value: profile })),
			});
		}

		if (defaultProfile) {
			setDefaultProfile(profileToRun);
		}

		executeRunProfile(profileToRun, launchSettingsPath);
	});

const getCmsRootPath = (path) =>
	path.split("/Properties/launchSettings")[0] || process.cwd();

function executeRunProfile(profileToRun, launchSettingsPath) {
	runProfile(profileToRun, getCmsRootPath(launchSettingsPath));
	printer.group(printer.env({ "Running profile": profileToRun }));
}

const runProfile = (profile, cmsRootPath) => {
	runShellCommand(`cd ${cmsRootPath} && dotnet`, [
		"watch",
		`--launch-profile "${profile}"`,
	]);
};

const readProfiles = async (filePath) => {
	try {
		const launchSettings = await new Promise((resolve) => {
			fs.readFile(filePath, "utf8", (err, data) => {
				if (err) {
					return printer.error(err);
				}

				resolve(data);
			});
		});

		if (!launchSettings) {
			printer.error("No launchsettings found");
			quit(1);
		}

		const profiles = Object.keys(JSON.parse(launchSettings).profiles);

		if (!profiles) {
			printer.error("No profiles found in launchsettings");
			quit(1);
		}

		return profiles;
	} catch (error) {
		printer.error(error);
		quit(1);
	}
};

async function setDefaultProfile(profile) {
	await projectConfig.setValues({ DEFAULT_PROFILE: profile });
}
