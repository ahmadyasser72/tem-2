import { fileURLToPath } from "node:url";

import fastifyMiddie from "@fastify/middie";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import pino from "pino";
import pinoPretty from "pino-pretty";

import { handler as ssrHandler } from "./dist/server/entry.mjs";

const app = Fastify({
	loggerInstance: pino(
		{ name: "site" },
		pino.multistream([
			{ level: "info", stream: pinoPretty() },
			{ level: "info", stream: pino.destination("../logs/site.log") },
		]),
	),
});

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
