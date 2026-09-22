import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// releases.mjs calls program.command(...) at import time, so #cli must be
// stubbed before the module under test is imported.
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

const { buildMarkdown, history, releasePattern, initialCommit, runRelease } =
	await import("./releases.mjs");

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

describe("releasePattern", () => {
	it("matches the release commit subject format", () => {
		expect(releasePattern.test("Release 2026/09/22 10:30 [skip ci]")).toBe(
			true,
		);
		expect(releasePattern.test("Release soon")).toBe(false);
	});
});

describe("buildMarkdown", () => {
	it("formats release headers and escapes markdown", () => {
		const commits = [
			{ hash: "abcdef1234567", subject: "Fix *bold* bug" },
			{ hash: "1111111111111", subject: "Release 2024/01/01 12:00 [skip ci]" },
		];
		const markdown = buildMarkdown(commits, "2024/02/02 09:00");
		expect(markdown).toContain("## 2024/02/02 09:00");
		expect(markdown).toContain("Fix \\*bold\\* bug (abcdef1)");
		expect(markdown).toContain("## 2024/01/01 12:00");
	});
});

describe("history / git", () => {
	let dir;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "opti-cli-test-"));
		initRepo(dir);
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("returns [] when there is no HEAD yet", () => {
		expect(history(dir)).toEqual([]);
	});

	it("lists commits newest-first via --first-parent", () => {
		commit(dir, "first");
		commit(dir, "second");

		const commits = history(dir);
		expect(commits).toHaveLength(2);
		expect(commits[0].subject).toBe("second");
		expect(commits[1].subject).toBe("first");
		expect(commits[0].hash).toMatch(/^[0-9a-f]{40}$/);
	});
});

describe("runRelease", () => {
	let dir;
	let cwdSpy;

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

	it("initializes CHANGELOGS.md when it doesn't exist and the user confirms", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);

		await runRelease();

		expect(fs.existsSync(path.join(dir, "CHANGELOGS.md"))).toBe(true);
		const commits = history(dir);
		expect(commits[0].subject).toBe(initialCommit);
	});

	it("does nothing when the user declines initialization", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(false);

		await runRelease();

		expect(fs.existsSync(path.join(dir, "CHANGELOGS.md"))).toBe(false);
	});

	it("commits a new release entry with pending commits", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease(); // creates CHANGELOGS.md + initialCommit

		commit(dir, "feature A");
		commit(dir, "feature B");
		confirmMock.mockResolvedValue(true);

		await runRelease();

		const content = fs.readFileSync(path.join(dir, "CHANGELOGS.md"), "utf8");
		expect(content).toContain("feature A");
		expect(content).toContain("feature B");

		const commits = history(dir);
		expect(releasePattern.test(commits[0].subject)).toBe(true);
	});

	it("reports no new commits to release when already up to date", async () => {
		commit(dir, "initial project commit");
		confirmMock.mockResolvedValue(true);
		await runRelease();

		await runRelease();

		expect(confirmMock).toHaveBeenCalledTimes(1);
	});
});
