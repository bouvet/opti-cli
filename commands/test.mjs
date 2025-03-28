import program from '../index.mjs';
import { Printer } from '../utils/printer.mjs';

program
  .command('test')
  .description('Test that commands are working')
  .action(async () => {
    const printer = new Printer('test');
    printer.info(
      `Commands are working! Current working directory: ${process.cwd()}`
    );
  });
