'use command';

import path from 'path';
import { fileURLToPath } from 'url';
import { shell } from '../../helpers/shell-command.mjs';
import baseCommand, { printer } from './db.mjs';
import { bacpac } from './helpers/bacpac.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cleanBacpacScript = path.join(__dirname, 'bin', 'clean-bacpac.sh');

baseCommand
  .command('clean')
  .description('Make a clean copy of a .bacpac file which might have redundant tables')
  .action(async () => {
    const bacpacPath = await bacpac.select();
    console.log("🚀 ~ bacpacPath:", bacpacPath);

    console.log("🚀 ~ scriptPath:", cleanBacpacScript);
    shell.run(`${cleanBacpacScript} "${bacpacPath}"`)
  });