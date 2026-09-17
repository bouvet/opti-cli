import fs from 'node:fs';
import path from 'node:path';
import registerEnv from '#bin/register-env.mjs';
import { Printer } from '#core/printer.mjs';
import { confirm } from '@inquirer/prompts';
import { optiInitCommand } from '../commands/init/_init.mjs';
import { writeFile, writeFileAbsolute } from './files.mjs';


const printer = new Printer('Project config');
const cwd = process.cwd();

export const projectConfig = {
    getConfig: getProjectConfig,
    setValues: setConfigValues,
}

/**
 * Gets the current working projects projects.json entry
 * @returns {Promise<ProjectConfig | undefined>}
 */
export async function getProjectConfig() {
    let projectInfo = findProjectConfigFile();

    if (!projectInfo) {
        printer.info('No config found.');
        const createConfig = await confirm({
            message: 'Do you want to init a .opti config in this directory?',
        })

        if (createConfig) {
            optiInitCommand();

            projectInfo = findProjectConfigFile();
        } else {
            quit(1);
        }
    }

    const projectFile = fs.readFileSync(projectInfo.filePath, 'utf8');
    try {
        return JSON.parse(projectFile);
    } catch (error) {
        printer.error('Failed to parse project config file!', error.message);
        quit(1);
    }
}

/**
 * 
 * @param {Record<string, string>} projectConfig 
 */
async function setConfigValues(projectConfig) {
    const config = await getProjectConfig();

    if (!config) {
        throw new Error("could not find config")
    }

    Object.entries(projectConfig).forEach(([k, v]) => config[k] = v);

    const projectInfo = findProjectConfigFile();

    await saveConfig(projectInfo?.filePath, config)
}

async function saveConfig(configAbsolutePath, config) {
    fs.writeFileSync(configAbsolutePath, JSON.stringify(config, null, 2));
}

/**
 * Recursively searches for the project.json file by traversing up the directory tree
 * @param {string} startDir - Directory to start searching from
 * @returns {{filePath: string, rootPath: string}|null} - Path to project.json and project root path, or null if not found
 */
function findProjectConfigFile(startDir = cwd) {
    const maxTraversal = 4;
    let traversalCount = 0;
    let currentDir = startDir;


    // Traverse up the directory tree
    while (traversalCount < maxTraversal) {
        const projectFilePath = path.join(currentDir, '.opti', 'project.json');

        if (fs.existsSync(projectFilePath)) {
            return {
                filePath: projectFilePath,
                rootPath: currentDir,
            };
        }

        // Get parent directory
        const parentDir = path.dirname(currentDir);

        // If we're at the root (parent is same as current)
        if (parentDir === currentDir) {
            return null;
        }

        // Move up to parent
        currentDir = parentDir;
        traversalCount++;
    }

    return null;
}