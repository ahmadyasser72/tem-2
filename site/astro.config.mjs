// @ts-check
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",
	security: { checkOrigin: false },
	adapter: node({ mode: "standalone" }),

	env: {
		schema: {
			DUITKU_MERCHANT_CODE: envField.string({
				access: "secret",
				context: "server",
			}),
			DUITKU_API_KEY: envField.string({ access: "secret", context: "server" }),
			DUITKU_BASE_URL: envField.string({ access: "secret", context: "server" }),
		},
	},

	vite: {
		plugins: [tailwindcss()],
		server: {
			allowedHosts: ["indekos.shares.zrok.io"],
			hmr: false,
		},
	},
	devToolbar: { enabled: false },
});
