import fs from 'node:fs';

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
