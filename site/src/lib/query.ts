import { getCurrentMonthStr } from "@indekos/utilities/date";

import { z } from "astro/zod";

export const querySchema = z.string().optional();

export const periodFields = {
	from: z.string().default(() => getCurrentMonthStr()),
	to: z.string().default(() => getCurrentMonthStr()),
} as const;

export const statusSchema = <T extends readonly string[]>(values: T) =>
	z.enum(values).optional().catch(undefined);
