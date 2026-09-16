# Team Opti CLI Tool

A collection of CLI commands to simplify workflow at Team Opti, working with Optimizely.

## Installation
Either clone the repository and install it from there or install it directly from releases.

### From releases

```bash
pnpm add -g https://github.com/bouvet/opti-cli/releases/latest/download/opti-cli.tgz
```

### From repository
Clone the repository, install dependencies and install the cli.

```bash
pnpm install
pnpm run cli:install
```

## Usage

In terminal, run `opti` followed by command. TO get a list of commands, run `opti -h`

# For Developers

### Global quit()

To exit excecution early, use the global `quit()` function. This is the same as using `process.exit`.

### Adding a command

Adding a command can be done by running the below command which generates a new one from a template.

```bash
npm run commands:add <name of command>
```

## Known Errors When Importing Database

### Could not allocate a new page for database
```sh
*** Could not allocate a new page for database 'arbi02mstr6nz45prep' because the 'PRIMARY' filegroup is full due to lack of storage space or database files reaching the maximum allowed size. Note that UNLIMITED files are still limited to 16TB. Create the necessary space by dropping objects in the filegroup, adding additional files to the filegroup, or setting autogrowth on for existing files in the filegroup.
```

This error occurs when docker does not have enough memory allocated. Can be fixed by going into docker settings and increasing the limit. 
The disk usage limit is the value that needs to be increased
> Docker -> settings -> resources -> Disk usage limit


