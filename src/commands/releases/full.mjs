"use command";
import fs from "node:fs";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import baseCommand, {
	buildMarkdown,
	git,
	history,
	initialCommit,
	printer,
	releasePattern,
} from "./releases.mjs";

baseCommand
	.command("full")
	.description(
		"Regenerate CHANGELOGS.md from the full git history since initialization (recovery, no commit)",
	)
	.option("-y, --yes", "Skip confirmation prompt (for pipelines)")
	.action((options) => runFull(options));

export async function runFull({ yes = false } = {}) {
	try {
		const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
		const filename = path.join(root, "CHANGELOGS.md");
		const commits = history(root);
		const baseline = commits.findIndex(
			(commit) => commit.subject === initialCommit,
		);

		if (baseline === -1) {
			throw new Error(
				"No initialization commit found; run 'releases' first to initialize CHANGELOGS.md.",
			);
		}
		if (fs.existsSync(filename) && !fs.lstatSync(filename).isFile()) {
			throw new Error("CHANGELOGS.md must be a regular file.");
		}

		const pending = commits.slice(0, baseline);
		const firstReleaseIndex = pending.findIndex((commit) =>
			releasePattern.test(commit.subject),
		);
		// Drop any commits made since the latest release; only rebuild what was actually released.
		const released =
			firstReleaseIndex === -1 ? [] : pending.slice(firstReleaseIndex);
		const markdown = buildMarkdown(released, null);

		printer.group();
		printer.info(
			`Will rebuild CHANGELOGS.md from ${released.length} released commit(s) since initialization.`,
		);
		printer.neutral("This does not create a commit.");
		printer.group();

		const shouldWrite =
			yes ||
			(await confirm({
				message: "Do you want to overwrite CHANGELOGS.md with the full log?",
				default: false,
			}));

		if (!shouldWrite) {
			printer.info("Aborted. No changes were made.");
			return;
		}

		fs.writeFileSync(filename, markdown);
		printer.success("CHANGELOGS.md has been regenerated from git history.");
	} catch (error) {
		if (error instanceof Error && error.name === "ExitPromptError") {
			printer.info("bye! 👋");
			return;
		}
		printer.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
