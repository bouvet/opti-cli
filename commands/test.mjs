import program from '../index.mjs';
import { Logger } from '../utils/logger.mjs';

program
  .command('test')
  .description('Test that commands are working')
  .action(async () => {
    console.log(
      `Commands are working! Current working directory: ${process.cwd()}`
    );
  });
