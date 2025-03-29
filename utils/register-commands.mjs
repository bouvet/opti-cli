#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';

/**
 * Automatically register all the commands by reading the commands directory.
 */
export default async function registerCommands() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const commandsDir = path.resolve(__dirname, '../commands');

  try {
    const commandFiles = await readdir(commandsDir);

    for (const file of commandFiles) {
      if (file.endsWith('.mjs')) {
        const commandPath = path.join(commandsDir, file);
        await import(commandPath);
      }
    }

    return Promise.resolve();
  } catch (err) {
    console.error(`Error reading commands directory: ${err.message}`);
    throw err;
  }
}
