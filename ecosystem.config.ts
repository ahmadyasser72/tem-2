import type { EcosystemConfig } from "bm2/types";

const config: EcosystemConfig = {
	apps: [
		{
			name: "site",
			cwd: "./site",
			script: "node_modules/.bin/astro",
			args: ["preview"],
			outFile: "logs/site/out.log",
			errorFile: "logs/site/error.log",
			env: {
				HOST: "0.0.0.0",
				PORT: "4321",
			},
		},
		{
			name: "scheduler",
			cwd: "./packages/scheduler",
			script: "src/index.ts",
			outFile: "logs/scheduler/out.log",
			errorFile: "logs/scheduler/error.log",
		},
		{
			name: "whatsapp-bot",
			cwd: "./packages/whatsapp-bot",
			script: "src/index.ts",
			outFile: "logs/whatsapp-bot/out.log",
			errorFile: "logs/whatsapp-bot/error.log",
		},
	],
};

export default config;
