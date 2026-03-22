import { defineConfig } from "drizzle-kit";

import { DB_PATH } from "./src";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/schema/index.ts",
	dbCredentials: { url: DB_PATH },
});
