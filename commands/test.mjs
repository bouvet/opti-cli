import program from '../index.mjs';
const cwd = process.cwd();
program
  .command('test')
  .description('Test that commands are working')
  .action(async () => {
    console.log(`Commands are working! Current working directory: ${cwd}`);
  });
