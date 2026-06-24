import { db } from "@e-kos/database";
import {
	auditDetail,
	auditLogs,
	notifications,
	users,
} from "@e-kos/database/schema";

import { logger } from "../logger";

export const runRentReminder = async (
	systemUser: typeof users.$inferSelect,
	now?: Date,
) => {
	const ref = now ?? new Date();
	const threeDaysLater = new Date(ref.getTime() + 3 * 24 * 60 * 60 * 1000);

	const dueInvoices = await db.query.invoices.findMany({
		where: {
			status: "unpaid",
			dueDate: { gte: ref, lte: threeDaysLater },
		},
		with: {
			lease: {
				with: {
					tenant: true,
				},
			},
		},
	});

	const rows = dueInvoices
		.filter((inv) => inv.lease?.tenant)
		.map((inv) => ({
			tenantId: inv.lease!.tenant!.id,
			invoiceId: inv.id,
			type: "reminder" as const,
			status: "pending" as const,
		}));

	const ids = (
		rows.length > 0
			? await db
					.insert(notifications)
					.values(rows)
					.returning({ id: notifications.id })
			: []
	).map((r) => r.id);

	const count = ids.length;
	if (count > 0) {
		await db.insert(auditLogs).values({
			userId: systemUser.id,
			action: "CREATE",
			tableName: "notifications",
			details: auditDetail.cron(
				`Cron created ${count} payment reminder notification(s)`,
				"notifications",
				ids,
			),
		});
	}

	logger.info({ count }, "Reminders created");
};
