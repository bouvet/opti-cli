import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changelogFileName } from "#core/constants.js";

// releases.mjs (imported by full.mjs) calls program.command(...) at import
// time, so #cli must be stubbed before the module under test is imported.
vi.mock("#cli", () => {
	const chainable = {
		command: () => chainable,
		description: () => chainable,
		option: () => chainable,
		action: () => chainable,
	};
	return { default: chainable };
});

const confirmMock = vi.fn();
vi.mock("@inquirer/prompts", () => ({
	confirm: (...args) => confirmMock(...args),
}));

const { runRelease } = await import("./releases.mjs");
const { runFull } = await import("./full.mjs");

function initRepo(dir) {
	execFileSync("git", ["init", "-q", "--initial-branch=master"], { cwd: dir });
	execFileSync("git", ["config", "user.email", "t@t.com"], { cwd: dir });
	execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
}

function commit(dir, message) {
	fs.writeFileSync(path.join(dir, "file.txt"), message);
	execFileSync("git", ["add", "."], { cwd: dir });
	execFileSync("git", ["commit", "-q", "-m", message], { cwd: dir });
}

describe("runFull", () => {
	let dir;
	let cwdSpy;
	const changelogPath = () => path.join(dir, changelogFileName);

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "opti-cli-test-"));
		initRepo(dir);
		cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(dir);
		confirmMock.mockReset();
	});

	afterEach(() => {
		cwdSpy.mockRestore();
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("throws when there is no initialization commit", async () => {
		commit(dir, "some commit");

		await runFull();

		// runFull swallows the error via printer.error and sets exitCode instead of throwing
		expect(process.exitCode).toBe(1);
		process.exitCode = 0;
	});

	it("rebuilds CHANGELOGS.md from released commits without committing", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease(); // creates CHANGELOGS.md + initialCommit

		commit(dir, "feature A");
		confirmMock.mockResolvedValue(true);
		await runRelease(); // creates a release commit for "feature A"

		fs.writeFileSync(changelogPath(), "corrupted content");
		confirmMock.mockResolvedValue(true);

		await runFull();

		const content = fs.readFileSync(changelogPath(), "utf8");
		expect(content).toContain("feature A");
		expect(content).not.toContain("corrupted content");
	});

	it("does not write when the user declines", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();
		commit(dir, "feature A");
		await runRelease();

		fs.writeFileSync(changelogPath(), "untouched");
		confirmMock.mockResolvedValue(false);

		await runFull();

		expect(fs.readFileSync(changelogPath(), "utf8")).toBe("untouched");
	});

	it("leaves the file alone when there are no releases yet", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();
		commit(dir, "unreleased work");
		confirmMock.mockClear();

		fs.writeFileSync(changelogPath(), "untouched");
		await runFull();

		expect(confirmMock).not.toHaveBeenCalled();
		expect(fs.readFileSync(changelogPath(), "utf8")).toBe("untouched");
	});

	it("excludes commits made after the latest release", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();

		commit(dir, "feature A");
		confirmMock.mockResolvedValue(true);
		await runRelease();

		commit(dir, "unreleased work in progress");
		confirmMock.mockResolvedValue(true);

		await runFull();

		const content = fs.readFileSync(changelogPath(), "utf8");
		expect(content).toContain("feature A");
		expect(content).not.toContain("unreleased work in progress");
	});

	it("refuses to run on a branch that isn't allowlisted", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();

		execFileSync("git", ["checkout", "-q", "-b", "feature/x"], { cwd: dir });
		fs.writeFileSync(changelogPath(), "untouched");

		await runFull();

		expect(process.exitCode).toBe(1);
		process.exitCode = 0;
		expect(fs.readFileSync(changelogPath(), "utf8")).toBe("untouched");
	});

	it("skips plain git merge commits but keeps 'Merged PR' entries", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();

		commit(dir, "feature A");
		const git = (...args) => execFileSync("git", args, { cwd: dir });
		git(
			"commit",
			"-q",
			"--allow-empty",
			"-m",
			"Merge remote-tracking branch 'origin/master' into develop",
		);
		git("commit", "-q", "--allow-empty", "-m", "Merged PR 7: feature B");
		await runRelease();

		fs.writeFileSync(changelogPath(), "corrupted content");
		await runFull();

		const content = fs.readFileSync(changelogPath(), "utf8");
		expect(content).toContain("feature A");
		expect(content).toContain("- feature B");
		expect(content).not.toContain("Merge remote-tracking");
	});

	// Mirrors Azure DevOps: markers are committed on a branch and merged via PR.
	async function runOnBranchAndMerge(branch, action, { squash = false } = {}) {
		const git = (...args) =>
			execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
		git("checkout", "-q", "-b", branch);
		await action();
		git("checkout", "-q", "master");
		const message = `Merged PR 1: ${git("log", "-1", "--format=%s", branch)}`;
		if (squash) {
			git("merge", "-q", "--squash", branch);
			git("commit", "-q", "-m", message);
		} else {
			git("merge", "-q", "--no-ff", "-m", message, branch);
		}
	}

	it.each([
		["merge commits", false],
		["squash merges", true],
	])("finds init and release markers brought in via %s", async (_, squash) => {
		confirmMock.mockResolvedValue(true);
		commit(dir, "initial project commit");
		await runOnBranchAndMerge("init", () => runRelease({ branch: ["init"] }), {
			squash,
		});

		commit(dir, "feature A");
		await runOnBranchAndMerge(
			"release",
			() => runRelease({ branch: ["release"] }),
			{ squash },
		);
		commit(dir, "unreleased work");

		fs.writeFileSync(changelogPath(), "corrupted content");
		await runFull();

		expect(process.exitCode ?? 0).toBe(0);
		const content = fs.readFileSync(changelogPath(), "utf8");
		expect(content).toMatch(
			/^# Changelog\n\n## \d{4}\/\d{2}\/\d{2} \d{2}:\d{2}\n\n- feature A \([0-9a-f]{7}\)\n$/,
		);
	});
});
