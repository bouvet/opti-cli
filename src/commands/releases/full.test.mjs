import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// releases.mjs (imported by full.mjs) calls program.command(...) at import
// time, so #cli must be stubbed before the module under test is imported.
vi.mock("#cli", () => {
	const chainable = {
		command: () => chainable,
		description: () => chainable,
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
	execFileSync("git", ["init", "-q"], { cwd: dir });
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
	const changelogPath = () => path.join(dir, "CHANGELOGS.md");

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

		fs.writeFileSync(changelogPath(), "untouched");
		confirmMock.mockResolvedValue(false);

		await runFull();

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
});
