"use command";

import program from "#cli";
import { optiInitCommand } from "./_init.mjs";

program
	.command("init")
	.skipConfig()
	.description("Basic setup for using opti cli")
	.action(async () => {
		await optiInitCommand();
	});
