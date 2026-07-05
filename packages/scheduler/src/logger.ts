import { createLogger, pino } from "@indekos/utilities/logger";

export const logger: pino.Logger = createLogger("scheduler");
