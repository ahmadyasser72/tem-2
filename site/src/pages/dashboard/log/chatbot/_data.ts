import { CHATBOT_DIRECTIONS, db } from "@e-kos/database";

import { z } from "astro/zod";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export const chatbotQuerySchema = z.object({
	query: querySchema,
	direction: statusSchema(CHATBOT_DIRECTIONS),
	...periodFields,
});

export async function fetchChatbotLogs(
	params: z.infer<typeof chatbotQuerySchema>,
) {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

	const logs = await db.query.chatbotMessages.findMany({
		where: {
			...(params.query && {
				OR: [
					{ message: { like: `%${params.query}%` } },
					{ tenant: { fullName: { like: `%${params.query}%` } } },
				],
			}),

			...(params.direction && { direction: params.direction }),

			sentAt: { gte: startDate, lte: endDate },
		},
		with: {
			tenant: {
				with: {
					lease: { with: { room: true } },
				},
			},
		},
		orderBy: { sentAt: "desc" },
	});

	return logs.map(({ tenant, ...log }) => ({
		...log,
		tenantName: tenant.fullName,
		roomNumber: tenant.lease?.room?.roomNumber ?? "-",
	}));
}

export const DIRECTION_BADGES = {
	incoming: "badge-info",
	outgoing: "badge-success",
} satisfies Record<(typeof CHATBOT_DIRECTIONS)[number], string>;

export const DIRECTION_ICONS = {
	incoming: "lucide:arrow-down-circle" as const,
	outgoing: "lucide:arrow-up-circle" as const,
} satisfies Record<(typeof CHATBOT_DIRECTIONS)[number], string>;

export const DIRECTION_LABELS = {
	incoming: "Masuk",
	outgoing: "Keluar",
} satisfies Record<(typeof CHATBOT_DIRECTIONS)[number], string>;
