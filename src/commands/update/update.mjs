"use command";
import program from "#cli";
import { Printer } from "#core/printer.mjs";
import { shell } from "#helpers/shell-command.mjs";

const printer = new Printer("opti-cli");

program
	.command("update")
	.description("Updates the cli tool to newest version")
	.skipConfig()
	.action(async () => {
		await shell.run(
			"pnpm add -g --force https://github.com/bouvet/opti-cli/releases/latest/download/opti-cli.tgz",
		);
		printer.success("Updated to newest version");
	});
