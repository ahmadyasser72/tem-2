import { AUDIT_ACTIONS, db } from "@e-kos/database";

import { z } from "astro/zod";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export { AUDIT_ACTIONS };

export const fetchAuditLogs = async (
	params: z.infer<typeof auditQuerySchema>,
) => {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

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
			...(!params.show_system && { user: { role: { ne: "system" } } }),
		},
		with: {
			user: {
				columns: { username: true, displayName: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return logs.map(
		({ user = { displayName: null, username: "Sistem" }, ...log }) => ({
			...log,
			username: user?.username,
			displayName: user?.displayName ?? user?.username,
		}),
	);
};

export const auditQuerySchema = z.object({
	query: querySchema,
	...periodFields,
	action: statusSchema(AUDIT_ACTIONS),
	show_system: z.stringbool().catch(false),
});

export const ACTION_BADGES = {
	CREATE: "badge-success text-white",
	UPDATE: "badge-warning text-white",
	DELETE: "badge-error text-white",
	REJECT: "badge-ghost",
	LOGIN: "badge-info text-white",
} satisfies Record<(typeof AUDIT_ACTIONS)[number], string>;

export const AUDIT_ACTION_LABELS = {
	CREATE: "Membuat",
	UPDATE: "Mengubah",
	DELETE: "Menghapus",
	REJECT: "Menolak",
	LOGIN: "Login",
} satisfies Record<(typeof AUDIT_ACTIONS)[number], string>;
