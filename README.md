# Team Opti CLI Tool

CLI tools to streamline Team Opti's Optimizely workflow.

## Pre-requisites
- Installed `pnpm` and `node`.
- MacOS

## Installation
Either clone the repository and install it from there or install it directly from releases.

### From releases

Install latest version:
```bash
# --force flag ensures pnpm cache busting and pulling lates release
pnpm add -g --force https://github.com/bouvet/opti-cli/releases/latest/download/opti-cli.tgz

# check installation:
opti --version
```

Install specific version:
```bash
pnpm add -g --force https://github.com/bouvet/opti-cli/archive/refs/tags/vX.X.X.tar.gz
```

Uninstall:
```bash
pnpm remove -g @bouvet/opti-cli
```

### From repository
Clone the repository, install dependencies and install the cli:
```bash
pnpm install
pnpm cli:install
```

Uninstall:
```bash
pnpm cli:uninstall
```
## Getting started

To start using opti-cli with your Optimizely project, initialize a project config in the root of your project's repo:
```bash
# in root of your repo, or wherever inside your project that suits you
$ opti init
``` 
This creates a directory `.opti` where all opti-cli related configs and files exist.

Run this command in all your Optimizely projects where you want to use opti-cli.

> 💡 Remember to push your updated `.gitignore`

## Usage

In terminal, run `opti` followed by command. To get a list of commands, run `opti -h`. To view current project settings, run `opti config`.

### Importing and running a local database with Docker
Download a database through the DXP portal, and place the resulting `.bacpac` file in the `.opti/bacpac` directory of your Optimizely project. 

Run the database import wizard and follow the steps:
```bash
$ opti db
```

This creates a `docker-compose.yml` file in the `.opti` directory and starts a container stack in Docker which runs your database. The database is then imported using the `dotnet` cli and `sqlpackage`. Your selected appsettings.json in updated with the new connection string.

There are a lot of commands associated with the `opti db` command, to list them:
```bash
$ opti db --help
```

The main ones are:
```bash
$ opti db # do a full database setup and import
$ opti db clean # create copy of database with redundant tables removed
$ opti db import # redo import with previously selected .bacpac
$ opti db apply # re-apply connection string to appsettings
```

### Running app with different launch profiles
If you have a lot of profiles in launchSettings.json, `opti watch` lets you pick between them. Use the `-d` flag to pin picked option as default to run in the future.
```bash
$ opti watch
$ opti watch --default # use selected profile as default
$ opti watch --profile <profile> # use this profile bypassing the wizard and default
```

### Completely clean project build
Opti clean tries to completely clean the project build files by rm -rf the obj, bin and modules directories and rebuilds project by running dotnet clean, dotnet restore and dotnet build.
```bash
$ opti clean
```

# For Developers

### Adding a command

Adding a command can be done by running the below command which generates a new one from a template.

```bash
pnpm commands:add <name of command>
```

### Global quit()

To exit excecution early, use the global `quit()` function. This is the same as using `process.exit`.

# Known errors

## Importing Database

### Could not allocate a new page for database
```sh
*** Could not allocate a new page for database '[database]' because the 'PRIMARY' filegroup is full due to lack of storage space or database files reaching the maximum allowed size.
```

This error occurs when Docker does not have enough storage allocated. Can be fixed by going into docker settings and increasing the limit, or removing large tables using `opti db clean`.

To increase Docker storage limit:
> Docker -> settings -> resources -> Disk usage limit


