import { CHATBOT_DIRECTIONS, db } from "@e-kos/database";

import { z } from "astro/zod";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export const chatbotQuerySchema = z.object({
	query: querySchema,
	direction: statusSchema(CHATBOT_DIRECTIONS),
	...periodFields,
});

export type ChatbotLogRow = {
	id: number;
	time: Date;
	tenantName: string;
	roomNumber: string;
	direction: string;
	message: string;
};

export async function fetchChatbotLogs(
	params: z.infer<typeof chatbotQuerySchema>,
	extra?: { tenantId?: number; parseMode?: "month" | "day" },
): Promise<ChatbotLogRow[]> {
	const { startDate, endDate } = parseDateRange(
		params.from,
		params.to,
		extra?.parseMode ?? "month",
	);

	const where: Record<string, unknown> = {};

	if (params.query) {
		where.OR = [
			{ message: { like: `%${params.query}%` } },
			{ tenant: { fullName: { like: `%${params.query}%` } } },
		];
	}
	if (params.direction) {
		where.direction = params.direction;
	}
	if (startDate || endDate) {
		const sentAtFilter: Record<string, Date> = {};
		if (startDate) sentAtFilter.gte = startDate;
		if (endDate) sentAtFilter.lte = endDate;
		where.sentAt = sentAtFilter;
	}
	if (extra?.tenantId != null) {
		where.tenantId = extra.tenantId;
	}

	const logs = await db.query.chatbotMessages.findMany({
		where,
		with: {
			tenant: {
				with: {
					leases: {
						where: { isActive: true },
						with: { room: true },
					},
				},
			},
		},
		orderBy: { sentAt: "desc" },
	});

	return logs.map((log) => {
		const activeLease = log.tenant?.leases?.[0];
		return {
			id: log.id,
			time: log.sentAt,
			tenantName: log.tenant?.fullName ?? "-",
			roomNumber: activeLease?.room?.roomNumber ?? "-",
			direction: log.direction,
			message: log.message,
		};
	});
}

export const DIRECTION_BADGES: Record<
	(typeof CHATBOT_DIRECTIONS)[number],
	string
> = {
	incoming: "badge-info",
	outgoing: "badge-success",
};

export const DIRECTION_ICONS: Record<
	(typeof CHATBOT_DIRECTIONS)[number],
	string
> = {
	incoming: "line-md:arrow-down-circle",
	outgoing: "line-md:arrow-up-circle",
};

export const DIRECTION_LABELS: Record<
	(typeof CHATBOT_DIRECTIONS)[number],
	string
> = {
	incoming: "Masuk",
	outgoing: "Keluar",
};
