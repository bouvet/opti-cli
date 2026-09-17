'use command';

import program from '#cli';
import { Printer } from '#core/printer.mjs';

program
  .command('test')
  .description('Test that commands are working')
  .action(async () => {
    const printer = new Printer('test');
    printer.info(
      `Commands are working! Current working directory: ${process.cwd()}`
    );

    printer.info("info")
    printer.warning("warning", "message")
    printer.help("help")
    printer.neutral("neutral")
    printer.path("path", "path")
    printer.success("success")
    printer.env({ "env": "value" })
    printer.error("error", new Error("stacktrace"), "additional error details")
    printer.done("done")
  });
