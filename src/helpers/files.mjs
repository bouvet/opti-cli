import fs, { readdirSync } from "node:fs";
import path from "node:path";

/* 
  This should be rewritten into a better implementation, or dropped altogether and replaed with just fs. 
  Maybe even just use fs-extra, seems like a nice wrapper.
*/

const cwd = process.cwd();

export function getFile(pathFromRoot, fileName) {
	try {
		return [
			null,
			fs.readFileSync(cwd + "/" + pathFromRoot + "/" + fileName, "utf-8"),
		];
	} catch (error) {
		return [error];
	}
}

export function writeFile(pathFromRoot, fileToWriteTo, toWrite) {
	try {
		return [
			null,
			fs.writeFileSync(
				cwd + "/" + pathFromRoot + "/" + fileToWriteTo,
				toWrite,
				"utf-8",
			),
		];
	} catch (error) {
		return [error];
	}
}

export function writeFileAbsolute(absolutePath, fileToWriteTo, toWrite) {
	try {
		return [
			null,
			fs.writeFileSync(absolutePath + "/" + fileToWriteTo, toWrite, "utf-8"),
		];
	} catch (error) {
		return [error];
	}
}

export function appendFile(pathFromRoot, fileToAppendTo, toAppend) {
	try {
		return [
			null,
			fs.appendFileSync(
				cwd + "/" + pathFromRoot + "/" + fileToAppendTo,
				toAppend,
				"utf-8",
			),
		];
	} catch (error) {
		return [error];
	}
}

export function listDir(path) {
	try {
		return [null, fs.readdirSync(path)];
	} catch (error) {
		return [error];
	}
}

export function createDir(path) {
	try {
		return [null, fs.mkdirSync(path, { recursive: true })];
	} catch (error) {
		return [error];
	}
}

/**
 *
 * @param {string} directory
 * @param {string} targetFile
 * @param { {useFileExtension?: boolean, relativePath?: boolean, ignoreDirectories?: Array<string>, fuzzy?: boolean} } [options]
 * @returns {string[]}
 */
export function searchFilesRecursive(
	directory,
	targetFile,
	options = {
		useFileExtension: false,
		relativePath: false,
		ignoreDirectories: [],
		fuzzy: false,
	},
) {
	const {
		useFileExtension,
		relativePath,
		ignoreDirectories = [],
		fuzzy = false,
	} = options;

	const entries = readdirSync(directory, { withFileTypes: true }).filter(
		(item) =>
			item.name !== "node_modules" && !ignoreDirectories.includes(item.name),
	);

	const results = [];

	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name);

		const isMatch =
			entry.isFile() &&
			(fuzzy
				? entry.name.includes(targetFile)
				: useFileExtension
					? entry.name.endsWith(targetFile)
					: entry.name === targetFile);

		if (isMatch) {
			results.push(
				relativePath ? `./${path.relative(process.cwd(), fullPath)}` : fullPath,
			);
		} else if (entry.isDirectory()) {
			results.push(searchFilesRecursive(fullPath, targetFile, options));
		}
	}

	return results.flat();
}
