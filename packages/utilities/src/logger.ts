import path from "node:path";

import pino from "pino";
import PinoPretty from "pino-pretty";

import { MONOREPO_ROOT } from "./monorepo";

export { pino };

export const createLogger = (name: string): pino.Logger<never> =>
	pino(
		{ name },
		pino.multistream([
			{ level: "info", stream: PinoPretty() },
			{
				level: "info",
				stream: pino.destination(
					path.join(MONOREPO_ROOT, "logs", `${name}.log`),
				),
			},
		]),
	);
