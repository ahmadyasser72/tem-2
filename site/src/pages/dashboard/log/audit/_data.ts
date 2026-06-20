import { AUDIT_ACTIONS, db } from "@e-kos/database";

import { z } from "astro/zod";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export const auditQuerySchema = z.object({
	query: querySchema,
	...periodFields,
	action: statusSchema(AUDIT_ACTIONS),
	show_system: z.string().optional().catch(undefined),
});

export type AuditLogRow = {
	id: number;
	time: Date;
	username: string;
	displayName: string;
	action: string;
	table: string;
	recordId: number | null;
	details: string | null;
};

export async function fetchAuditLogs(
	params: z.infer<typeof auditQuerySchema>,
	extra?: { userId?: number; showSystem?: boolean },
): Promise<AuditLogRow[]> {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

	const hideSystem =
		extra?.showSystem !== undefined ? !extra.showSystem : !params.show_system;

	const logs = await db.query.auditLogs.findMany({
		where: {
			...(params.query && {
				OR: [
					{ action: { like: `%${params.query}%` } },
					{ tableName: { like: `%${params.query}%` } },
					{ recordId: { like: `%${params.query}%` } },
					{ user: { username: { like: `%${params.query}%` } } },
				],
			}),
			createdAt: { gte: startDate, lte: endDate },
			...(params.action && { action: params.action }),
			...(extra?.userId != null && { userId: extra.userId }),
			...(hideSystem && { user: { role: { ne: "system" } } }),
		},
		with: { user: true },
		orderBy: { createdAt: "desc" },
	});

	return logs.map((log) => ({
		id: log.id,
		time: log.createdAt,
		username: log.user?.username ?? "Sistem",
		displayName: log.user?.displayName ?? log.user?.username ?? "Sistem",
		action: log.action,
		table: log.tableName,
		recordId: log.recordId,
		details: log.details,
	}));
}

export const ACTION_BADGES: Record<(typeof AUDIT_ACTIONS)[number], string> = {
	CREATE: "badge-success text-white",
	UPDATE: "badge-warning text-white",
	DELETE: "badge-error text-white",
};

export const AUDIT_ACTION_LABELS: Record<
	(typeof AUDIT_ACTIONS)[number],
	string
> = {
	CREATE: "Membuat",
	UPDATE: "Mengubah",
	DELETE: "Menghapus",
};
