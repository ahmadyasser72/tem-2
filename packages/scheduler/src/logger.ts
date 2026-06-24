import pino from "pino";
import pinoPretty from "pino-pretty";

export const logger = pino(
	{ name: "scheduler" },
	pino.multistream([
		{ level: "info", stream: pinoPretty() },
		{ level: "info", stream: pino.destination("../../logs/scheduler.log") },
	]),
);
