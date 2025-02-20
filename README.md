# Team Opti CLI Tool

A collection of CLI commands to simplify workflow at Team Opti, working with Optimizely.

## Features

- **Optimized Commands**: Predefined commands tailored for Team Optimizely workflows.
- **Test Environment**: A `testenv` folder (ignored by version control) where you can replicate an Optimizely environment to test the tool safely.
- **Extensible**: Built with [Commander.js](https://github.com/tj/commander.js), making it easy to add and customize commands.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org)
- [npm](https://www.npmjs.com/)

Some scripts require dotnet to run:
- [Dotnet](https://dotnet.microsoft.com/en-us/download)

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:bouvet/opti-cli.git
cd opti-cli
npm install
npm run cli:install
```

### Usage

In terminal, run `opti` followed by command.

### Commands

| Command           | Description                                                                                     | Options                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `opti db`         | Configure project's connection string, create `docker-compose.yml`, and import `.bacpac` files. | `-p, --port <port>`: Specify the port for the database (default `1433:1433`).               |
|                   |                                                                                                 | `-n, --name <name>`: Specify the name of the database container (default `sqledge-<port>`). |
|                   |                                                                                                 | `-k, --kill`: Kill the entire container stack and related database.                         |
| `opti db up`      | Start the database container stack in detached mode using `docker compose up`.                  | N/A                                                                                         |
| `opti db down`    | Stop the database container stack using `docker compose down`.                                  | N/A                                                                                         |
| `opti db import`  | Import a `.bacpac` file, destroying the existing database and re-importing it.                  | N/A                                                                                         |
| `opti sqlpackage` | Install sqlpackage with dotnet cli and add it to path                                           | `--uninstall`: Uninstalls sqlpackage                                                        |
| `opti watch`      | Starts `dotnet watch` with the ability to choose which launch profile to run.                   | N/A                                                    |

### Adding a command

Adding a command can be done with this snippet which generates a new one from a template.

```bash
npm run commands:add <name of command>
