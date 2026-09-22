"use command";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import program from "#cli";
import { Printer } from "#core/printer.mjs";

export const printer = new Printer("releases");
export const initialCommit = "Initialize changelog [skip ci]";
export const releasePattern =
	/^Release (\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}) \[skip ci\]$/;

const baseCommand = program
	.command("releases")
	.description("Initialize CHANGELOGS.md or generate and commit a release")
	.action(() => runRelease());

export default baseCommand;

export function git(cwd, args) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

export function history(root) {
	if (!git(root, ["rev-parse", "--revs-only", "HEAD"])) return [];
	const fields = git(root, [
		"log",
		"--first-parent",
		"--format=%H%x00%s",
		"-z",
		"HEAD",
	]).split("\0");
	const commits = [];
	for (let index = 0; index < fields.length - 1; index += 2) {
		commits.push({ hash: fields[index], subject: fields[index + 1] });
	}
	return commits;
}

function timestamp() {
	const now = new Date();
	const pad = (value) => String(value).padStart(2, "0");
	return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function buildMarkdown(commits, headerLabel) {
	let markdown = "# Changelog\n\n";
	let isFirst = true;
	if (headerLabel) {
		markdown += `## ${headerLabel}\n\n`;
		isFirst = false;
	}
	for (const commit of commits) {
		const release = releasePattern.exec(commit.subject);
		if (release) {
			// Only separate with a blank line if a prior section/bullet was already written.
			markdown += `${isFirst ? "" : "\n"}## ${release[1]}\n\n`;
		} else {
			const subject = commit.subject
				.replace(/&/g, "&amp;")
				.replace(/[\\`*_[\]<>]/g, "\\$&");
			markdown += `- ${subject} (${commit.hash.slice(0, 7)})\n`;
		}
		isFirst = false;
	}
	return markdown;
}

export async function runRelease() {
	try {
		const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
		if (git(root, ["status", "--porcelain", "--untracked-files=all"])) {
			throw new Error("Commit or stash all changes before running releases.");
		}
		const filename = path.join(root, "CHANGELOGS.md");
		const commits = history(root);
		const baseline = commits.findIndex(
			(commit) => commit.subject === initialCommit,
		);

		if (!fs.existsSync(filename)) {
			printer.info("No CHANGELOGS.md found in this repository.");
			printer.neutral("Will create CHANGELOGS.md with commit:");
			printer.neutral(`  ${initialCommit}`);
			printer.group();

			const shouldCommit = await confirm({
				message: "Do you want to initialize and commit CHANGELOGS.md?",
				default: false,
			});

			if (!shouldCommit) {
				printer.info("Aborted. No changes were made.");
				return;
			}

			fs.writeFileSync(filename, "# Changelog\n", { flag: "wx" });
			git(root, ["add", "--", "CHANGELOGS.md"]);
			git(root, [
				"commit",
				"--only",
				"-m",
				initialCommit,
				"--",
				"CHANGELOGS.md",
			]);
			printer.success(initialCommit);
			return;
		}

		if (baseline === -1) {
			throw new Error(
				"CHANGELOGS.md exists without an initialization commit; it will not be overwritten.",
			);
		}
		const pending = commits.slice(0, baseline);
		if (!pending.length || releasePattern.test(pending[0].subject)) {
			printer.info("No new commits to release.");
			return;
		}
		if (!fs.lstatSync(filename).isFile()) {
			throw new Error("CHANGELOGS.md must be a regular file.");
		}

		const date = timestamp();
		const message = `Release ${date} [skip ci]`;

		const newCommits = [];
		for (const commit of pending) {
			if (releasePattern.test(commit.subject)) break;
			newCommits.push(commit);
		}

		const markdown = buildMarkdown(pending, date);

		printer.group();
		printer.info(`Release: ${message}`);
		printer.neutral(`Commits included (${newCommits.length}):`);
		for (const commit of newCommits) {
			printer.neutral(`  - ${commit.subject} (${commit.hash.slice(0, 7)})`);
		}
		printer.group();

		const shouldCommit = await confirm({
			message: "Do you want to commit this release?",
			default: false,
		});

		if (!shouldCommit) {
			printer.info("Release aborted. No changes were committed.");
			return;
		}

		fs.writeFileSync(filename, markdown);
		git(root, ["add", "--", "CHANGELOGS.md"]);
		git(root, ["commit", "--only", "-m", message, "--", "CHANGELOGS.md"]);
		printer.success(message);
	} catch (error) {
		if (error instanceof Error && error.name === "ExitPromptError") {
			printer.info("bye! 👋");
			return;
		}
		printer.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
