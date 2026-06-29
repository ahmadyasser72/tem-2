import { fileURLToPath } from "node:url";
import { createLogger } from "@indekos/utilities/logger";

import fastifyMiddie from "@fastify/middie";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";

// @ts-ignore
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const app = Fastify({ loggerInstance: createLogger("site") });

await app
	.register(fastifyStatic, {
		root: fileURLToPath(new URL("./dist/client", import.meta.url)),
	})
	.register(fastifyMiddie);
app.use(ssrHandler);

const port = Number(import.meta.env.PORT);
app.listen({
	host: import.meta.env.HOST ?? "127.0.0.1",
	port: Number.isNaN(port) ? 4321 : port,
});
