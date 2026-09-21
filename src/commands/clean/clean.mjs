"use command";
import program from "#cli";
import checkIsDotnetProject from "#core/prereq/checks/is-in-dotnet-project.mjs";
import { Printer } from "#core/printer.mjs";
import { shell } from "#helpers/shell-command.mjs";

const printer = new Printer("opti-cli");

program
	.command("clean")
	.skipConfig()
	.description(
		"Manually removes build output and restores packages and re-builds",
	)
	.prereq([checkIsDotnetProject])
	.action(async () => {
		await shell.run("rm -rf obj bin modules");
		printer.success("Removed 'obj' 'bin' and 'modules' directories");
		await shell.run("dotnet clean");
		printer.success("Cleaned build");
		await shell.run("dotnet restore");
		printer.success("Restored packages");
		await shell.run("dotnet build");
		printer.success("Built project");
	});
