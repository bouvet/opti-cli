"use command";
import program from "#cli";
import { Printer } from "#core/printer.mjs";
import { shell } from "#helpers/shell-command.mjs";

const printer = new Printer("opti-cli");

program
	.command("uninstall")
	.description("Uninstall opti-cli")
	.skipConfig()
	.action(async () => {
		await shell.run("pnpm remove -g @bouvet/opti-cli");
		printer.success("Uninstalled opti-cli");
	});
