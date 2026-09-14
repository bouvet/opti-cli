'use command'
import program from '#cli';
import { Printer } from '#core/printer.mjs';
import { projectConfig } from '#helpers/project-config.mjs';

const printer = new Printer("config")

program
  .command("config")
  .description('Lists project config')
  .action(() => {
    const config = projectConfig.getConfig();

    printer.group(
      Object.entries(config).forEach(([k, v]) => printer.env(k, v))
    );
  });