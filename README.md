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

### Adding a command

Adding a command can be done with this snippet which generates a new one from a template.

```bash
npm run commands:add <name of command>
```
