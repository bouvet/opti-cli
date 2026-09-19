import {
	appendFile,
	createDir,
	getFile,
	listDir,
	writeFile,
} from "#helpers/files.mjs";
import { Printer } from "#core/printer.mjs";
import { projectConfig } from "#helpers/project-config.mjs";

const cwd = process.cwd();
const printer = new Printer("init");

export async function optiInitCommand() {
	const missingOptiFolder = listDir(cwd + "/.opti")[0] !== null;
	const missingBacpacFolder = listDir(cwd + "/.opti/bacpac")[0] !== null;
	const missingProjectsConfig = getFile(".opti", "project.json")[0] !== null;
	const gitignore = getFile("", ".gitignore")[1];
	const missingGitignore = !gitignore;

	if (missingOptiFolder) {
		createDir(cwd + "/.opti");
		printer.info("Created .opti directory in app root");
	}

	if (missingBacpacFolder) {
		createDir(cwd + "/.opti/bacpac");
		printer.info("Created bacpac directory");
	}

	if (missingGitignore) {
		printer.neutral(
			"Missing .gitignore file in project, skipping updating gitignore.",
		);
	} else {
		if (!gitignore.includes(".opti")) {
			appendFile("", ".gitignore", "\n.opti");
			printer.info("Updated .gitignore to exclude .opti");
		}
	}

	if (missingProjectsConfig) {
		writeFile("/.opti", "project.json", JSON.stringify({}));
	}

	await projectConfig.setValues({
		PROJECT_ROOT_PATH: cwd,
		OPTI_FOLDER: cwd + "/.opti",
	});

	printer.info("Created project.json config file");
}
