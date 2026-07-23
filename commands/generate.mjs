import program from '../index.mjs';

const baseCmd = program
  .command('generate')
  .description('Generated command')
  .action(() => {
    console.log('Command "generate" is registered!');
  });

baseCmd.command('project').action(() => {
  // generate a project with out all-purpose alloy based template
  console.log('Generating with alloy template...');
});
