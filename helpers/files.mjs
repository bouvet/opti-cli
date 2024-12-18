import fs, { readdirSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

export function getFile(pathFromRoot, fileName) {
  try {
    return [
      null,
      fs.readFileSync(cwd + '/' + pathFromRoot + '/' + fileName, 'utf-8'),
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
        cwd + '/' + pathFromRoot + '/' + fileToWriteTo,
        toWrite,
        'utf-8'
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

export function searchFileRecursive(directory, targetFile) {
  const entries = readdirSync(directory, { withFileTypes: true }).filter(
    (item) => item.name !== 'node_modules'
  );
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isFile() && entry.name === targetFile) {
      results.push(fullPath);
    } else if (entry.isDirectory()) {
      results.push(searchFileRecursive(fullPath, targetFile));
    }
  }
  return results.flat();
}
