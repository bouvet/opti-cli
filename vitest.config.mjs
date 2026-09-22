import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			"#cli": new URL("./src/cli.mjs", import.meta.url).pathname,
			"#core": new URL("./src/core", import.meta.url).pathname,
			"#helpers": new URL("./src/helpers", import.meta.url).pathname,
		},
	},
});
