import program from '../index.mjs';
import { exec } from 'child_process'

const cwd = process.cwd();

program
    .command('watch')
    .description('Run dotnet watch with a specific profile from launchsettings')
    .action(async () => {
        console.log(`Commands are working! Current working directory: ${cwd}`)

        // Find files
        const currentDir = process.cwd()
        const fileName = 'launchSettings.json'

        /*
         * @constant {array}
        */
        const files = await searchFiles(currentDir, fileName)

        if (!files) {
            console.error(`🤔 Are you sure there is a file named ${fileName} in the current working directory?`)
        }

        let launchSettings

        if (files.length == 1) {
            launchSettings = files[0]
        }

        console.log(launchSettings)
    });

const searchFiles = async (dir, fileName) => {
    try {
        const findOutput = await new Promise((resolve, reject) => {
            exec(`find . -name ${fileName}`, (error, stdout, stderr) => {
                if (error) {
                    return reject(`Error: ${error.message}`);
                }
                if (stderr) {
                    return reject(`Stderr: ${stderr}`);
                }
                resolve(stdout.split('\n').filter(line => line !== ''));
            });
        });

        return findOutput
    } catch (error) {
        console.error(error);
    }
};
