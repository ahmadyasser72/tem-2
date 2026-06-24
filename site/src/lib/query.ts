import { z } from "astro/zod";

import { getCurrentMonthStr } from "~/lib/date";

export const querySchema = z.string().catch("");

export const periodFields = {
	from: z.string().default(getCurrentMonthStr()),
	to: z.string().default(getCurrentMonthStr()),
} as const;

export const statusSchema = <T extends readonly string[]>(values: T) =>
	z.enum(values).optional().catch(undefined);
