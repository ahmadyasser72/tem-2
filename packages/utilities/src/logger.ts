import path from "node:path";

import pino from "pino";
import PinoPretty from "pino-pretty";
import { workspaceRootSync } from "workspace-root";

export { pino };

const WORKSPACE_ROOT = workspaceRootSync();
export const createLogger = (name: string): pino.Logger<never> =>
	pino(
		{ name },
		pino.multistream([
			{ level: "info", stream: PinoPretty() },
			...(WORKSPACE_ROOT
				? [
						{
							level: "info",
							stream: pino.destination(
								path.join(WORKSPACE_ROOT, "logs", `${name}.log`),
							),
						},
					]
				: []),
		]),
	);
