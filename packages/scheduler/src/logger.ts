import pino from "pino";
import pinoPretty from "pino-pretty";

const logDir = process.env.LOG_PATH ?? "./logs";

export const logger = pino(
	{ name: "scheduler" },
	pino.multistream([
		{ level: "info", stream: pinoPretty() },
		{ level: "info", stream: pino.destination(`${logDir}/scheduler.log`) },
	]),
);
