import dayjs from "@indekos/utilities/date";

import { z } from "astro/zod";

export const querySchema = z.string().optional();

export const PERIOD_SEPARATOR = "~";
export const PERIOD_SEPARATOR_UI = "~";

export const periodSchema = z
	.templateLiteral([z.iso.date(), PERIOD_SEPARATOR, z.iso.date()])
	.catch(() => {
		const now = dayjs();
		const from = now.startOf("month").format("YYYY-MM-DD");
		const to = now.endOf("month").format("YYYY-MM-DD");
		return `${from}${PERIOD_SEPARATOR}${to}` as const;
	})
	.transform((s) => {
		const [from, to] = s.split(PERIOD_SEPARATOR);
		return { from: dayjs(from), to: dayjs(to) };
	});

export type Period = z.infer<typeof periodSchema>;

export const statusSchema = <T extends readonly string[]>(values: T) =>
	z.enum(values).optional().catch(undefined);
