import program from '../index.mjs';

program
  .command('test')
  .description('Test the project')
  .action(() => {
    console.log('Testing the project...');
  });
