import program from '../index.mjs';

const cwd = process.cwd();

program
    .command('watch')
    .description('Run dotnet watch with a specific profile from launchsettings')
    .action(async () => {
        console.log(`Commands are working! Current working directory: ${cwd}`);
    });
