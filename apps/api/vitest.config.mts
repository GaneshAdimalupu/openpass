import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// The `db` workspace package has no resolvable "main"; point at its source.
			db: fileURLToPath(
				new URL("../../packages/db/src/client.ts", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
