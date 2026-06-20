import { z } from "astro/zod";

import { getCurrentMonthStr, normalizePeriodRange } from "~/lib/date";

export const querySchema = z.string().catch("");

export const periodFields = {
	from: z.string().default(getCurrentMonthStr()),
	to: z.string().default(getCurrentMonthStr()),
} as const;

export const periodSchema = z.object(periodFields).transform((val) => {
	return normalizePeriodRange(val.from, val.to);
});

export function statusSchema<T extends readonly string[]>(values: T) {
	return z.enum(values).optional().catch(undefined);
}
