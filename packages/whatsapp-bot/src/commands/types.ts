import type { Logger } from "@indekos/utilities/logger";

import type { ConversationSession } from "~/conversation/types";

export type CommandHandlerFunction<Params extends any[] = []> = (
	tenant: ConversationSession["tenant"],
	...args: [...Params, options?: { logger?: Logger }]
) => string | Promise<string>;
