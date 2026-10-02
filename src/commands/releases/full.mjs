"use command";
import fs from "node:fs";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import { changelogFileName } from "#core/constants.js";
import baseCommand, {
	assertAllowedBranch,
	buildMarkdown,
	changelogCommits,
	defaultReleaseBranches,
	git,
	printer,
	releasePattern,
} from "./releases.mjs";

baseCommand
	.command("full")
	.description(
		`Regenerate ${changelogFileName} from the full git history since initialization (recovery, no commit)`,
	)
	.option(
		"-b, --branch <names...>",
		"Branch(es) allowed to run releases on",
		defaultReleaseBranches,
	)
	.action((options) => runFull(options));

export async function runFull({ branch = defaultReleaseBranches } = {}) {
	try {
		const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
		assertAllowedBranch(root, branch);
		const filename = path.join(root, changelogFileName);
		const changelog = changelogCommits(root);

		if (!changelog) {
			throw new Error(
				`No initialization commit found; run 'releases' first to initialize ${changelogFileName}.`,
			);
		}
		if (fs.existsSync(filename) && !fs.lstatSync(filename).isFile()) {
			throw new Error(`${changelogFileName} must be a regular file.`);
		}

		// Unreleased commits are intentionally left out.
		const { released } = changelog;
		const releaseCount = released.filter((commit) =>
			releasePattern.test(commit.subject),
		).length;
		if (!releaseCount) {
			printer.info("No releases found yet. Nothing to rebuild.");
			return;
		}
		const markdown = buildMarkdown(released, null);

		printer.group();
		printer.info(
			`Will rebuild ${changelogFileName} from ${releaseCount} release(s) and ${released.length - releaseCount} commit(s).`,
		);
		printer.neutral("This does not create a commit.");
		printer.group();

		const shouldWrite = await confirm({
			message: `Do you want to overwrite ${changelogFileName} with the full log?`,
			default: false,
		});

		if (!shouldWrite) {
			printer.info("Aborted. No changes were made.");
			return;
		}

		fs.writeFileSync(filename, markdown);
		printer.success(
			`${changelogFileName} has been regenerated from git history.`,
		);
	} catch (error) {
		if (error instanceof Error && error.name === "ExitPromptError") {
			printer.info("bye! 👋");
			return;
		}
		printer.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
