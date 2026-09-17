'use command'
import program from '#cli';
import { Printer } from '#core/printer.mjs';
import { projectConfig } from '#helpers/project-config.mjs';

const printer = new Printer("config")

program
  .command("config")
  .description('Lists project config')
  .action(async () => {
    const config = await projectConfig.getConfig();

    if (!config) {
      printer.warning("No config found")
      quit(0)
    }

    printer.group(
      printer.env(config)
    );
  });