import { db, NOTIFICATION_STATUS, NOTIFICATION_TYPES } from "@e-kos/database";

import { z } from "astro/zod";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";
import { formatInvoiceNumber } from "~/lib/transforms";

export const notificationQuerySchema = z.object({
	query: querySchema,
	...periodFields,
	type: statusSchema(NOTIFICATION_TYPES),
});

export const fetchNotifications = async (
	params: z.infer<typeof notificationQuerySchema>,
) => {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

	const notifications = await db.query.notifications.findMany({
		where: {
			...(params.query && {
				OR: [{ tenant: { fullName: { like: `%${params.query}%` } } }],
			}),

			...(params.type && { type: params.type }),

			createdAt: { gte: startDate, lte: endDate },
		},
		columns: {
			id: true,
			createdAt: true,
			type: true,
			status: true,
			invoiceId: true,
		},
		with: {
			tenant: {
				with: {
					lease: {
						with: { room: true },
					},
				},
			},
		},
		orderBy: { id: "desc" },
	});

	return notifications.map(({ invoiceId, tenant, ...notification }) => ({
		...notification,
		tenantName: tenant.fullName,
		roomNumber: tenant.lease?.room.roomNumber ?? "-",
		invoiceNumber: invoiceId ? formatInvoiceNumber(invoiceId) : "-",
	}));
};

export const NOTIFICATION_TYPE_BADGES = {
	reminder: "badge-warning",
	payment_success: "badge-success",
	welcome: "badge-primary",
	custom: "badge-info",
} satisfies Record<(typeof NOTIFICATION_TYPES)[number], string>;

export const NOTIFICATION_TYPE_LABELS = {
	reminder: "Pengingat",
	payment_success: "Pembayaran Berhasil",
	welcome: "Selamat Datang",
	custom: "Pesan Khusus",
} satisfies Record<(typeof NOTIFICATION_TYPES)[number], string>;

export const NOTIFICATION_STATUS_BADGES = {
	pending: "badge-warning",
	sent: "badge-success",
	failed: "badge-error",
} satisfies Record<(typeof NOTIFICATION_STATUS)[number], string>;
