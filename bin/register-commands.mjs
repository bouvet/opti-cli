#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, stat } from "node:fs/promises";

/**
 * Automatically register all the commands by reading the commands directory recursively.
 */
export default async function registerCommands() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const commandsDir = path.resolve(__dirname, "../src/commands");

	try {
		await processDirectory(commandsDir);
		return Promise.resolve();
	} catch (err) {
		// @ts-ignore
		console.error(`Error reading commands directory: ${err.message}`);
		throw err;
	}
}

/**
 * Recursively processes a directory to find and register command files.
 * @param {string} dirPath - The directory path to process
 */
async function processDirectory(dirPath) {
	const entries = await readdir(dirPath, { withFileTypes: false });

	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry);
		const stats = await stat(entryPath);

		if (stats.isDirectory()) {
			// Recursively process subdirectories
			await processDirectory(entryPath);
		} else if (stats.isFile() && entry.endsWith(".mjs")) {
			// Process files with .mjs extension
			const content = await readFile(entryPath, "utf8");

			// Only register commands that have the pragma
			if (content.includes("use command")) {
				await import(entryPath);
			}
		}
	}
}
