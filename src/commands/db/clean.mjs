"use command";

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import baseCommand, { printer } from "./db.mjs";
import { bacpac } from "./helpers/bacpac.mjs";

const tablesToRemove = [
	"dbo.SecurityReportTo",
	"dbo.BVN.NotFoundRequests",
	"dbo.NotFoundHandler.Suggestions",
];

baseCommand
	.command("clean")
	.description(
		"Creates a copy of a .bacpac file and removes redundant tables, possibly saving gigabytes of space when imported",
	)
	.option(
		"-t, --tables <tables...>",
		`Append what tables to remove. The defaults are: ${tablesToRemove.join(", ")}`,
	)
	.action(async (options) => {
		const { tables } = options;

		if (tables?.length) {
			tables.forEach((t) => {
				tablesToRemove.push(t);
			});
		}

		const bacpacPath = await bacpac.select();
		const [success, outputPath] = await cleanBacpac(bacpacPath);

		if (success && !outputPath) {
			printer.warning("Cleaning not performed", "");
			return;
		}

		if (!success && !outputPath) {
			return;
		}

		printer.done(`Backpack cleaned`);
		printer.path("created at", outputPath);
	});

/**
 * @param {string} bacpacPath
 */
export async function cleanBacpac(bacpacPath) {
	if (!fs.existsSync(bacpacPath)) {
		printer.info(`File not found: ${bacpacPath}`);
		return [false];
	}

	const dir = path.dirname(path.resolve(bacpacPath));
	const baseName = path.basename(bacpacPath, ".bacpac");
	const workDir = path.join(dir, `${baseName}__extracted`);
	const outputBacpac = path.join(dir, `${baseName}_clean.bacpac`);

	if (fs.existsSync(workDir) || fs.existsSync(outputBacpac)) {
		printer.info(`Removing existing output/work files:`);
		printer.path("workdir", workDir);
		printer.path("bacpac", outputBacpac);

		fs.rmSync(workDir, { recursive: true, force: true });
		fs.rmSync(outputBacpac, { force: true });
	}

	fs.mkdirSync(workDir, { recursive: true });

	try {
		printer.info(`Extracting ${bacpacPath}`);
		printer.neutral("This might take a few minutes...");
		await run("unzip", ["-q", path.resolve(bacpacPath), "-d", workDir]);

		const tablesRemoved = [];

		for (const table of tablesToRemove) {
			const targetDir = path.join(workDir, "Data", table);

			if (!fs.existsSync(targetDir)) {
				printer.info(`Skipping table`);
				printer.path(`${table}`, "not found");
				continue;
			}

			tablesRemoved.push(table);

			fs.rmSync(targetDir, { recursive: true, force: true });
			printer.info(`Deleted table`);
			printer.path(table);
		}

		if (!tablesRemoved.length) {
			printer.info(`No tables removed`);
			return [true];
		}

		printer.info("Creating clean bacpac");
		await run("zip", ["-qr", outputBacpac, "."], { cwd: workDir });

		return [true, outputBacpac];
	} catch (/** @type {any} */ err) {
		printer.error(err?.message || "Unknown error cleaning bacpac", err || "");
		return [false];
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
}

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const proc = spawn(command, args, { stdio: "inherit", ...options });
		proc.on("error", reject);
		proc.on("exit", (code) => {
			if (code === 0) resolve("");
			else reject(new Error(`${command} exited with code ${code}`));
		});
	});
}
