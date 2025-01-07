import program from '../index.mjs';
import { exec, spawn } from 'child_process'
import { select } from '@inquirer/prompts';
import fs from 'fs'
import { error } from 'console';

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

        if (files.length > 1) {
            console.log('multiple files found')

            launchSettings = await select({
                message: 'What .bacpac do you want to use?',
                choices: files.map((file) => ({ name: file, value: file })),
            });
        }

        console.log('Using ' + launchSettings)


        // Choose profile to run

        let profileToRun
        const profiles = await readProfiles(launchSettings)

        if (profiles.length == 1) {
            profileToRun = profiles[0]
        }

        if (profiles.length > 1) {
            console.log('multiple profiles found')

            profileToRun = await select({
                message: 'What .profile do you want to run?',
                choices: profiles.map((profile) => ({ name: profile, value: profile })),
            });


        }

        console.log(`Running profile "${profileToRun}"`)

        runProfile(profileToRun)
    });

const runProfile = (profile) => {
    const command = `dotnet watch --launch-profile "${profile}"`
    const dotnetWatch = spawn(command, {
        stdio: 'inherit',
        shell: true
    })

    dotnetWatch.on('close', (code) => {
        console.log('process exited with code: ', code)
    })
}


const readProfiles = async (filePath) => {
    try {
        const launchSettings = await new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    return console.error(error)
                }

                resolve(data)
            })
        })

        if (!launchSettings) {
            return console.error('No launchsettings found')
        }

        const profiles = Object.keys(JSON.parse(launchSettings).profiles)

        if (!profiles) {
            return console.error('No profiles found in launchsettings')
        }

        return profiles

    } catch (error) {
        console.error(error)
    }
}

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
