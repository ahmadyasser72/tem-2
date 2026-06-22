import { db } from "@e-kos/database";
import {
	auditDetail,
	auditLogs,
	notifications,
	users,
} from "@e-kos/database/schema";

export async function runRentReminder(
	systemUser: typeof users.$inferSelect,
	now?: Date,
) {
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

	const ids = [] as number[];
	for (const inv of dueInvoices) {
		if (!inv.lease?.tenant) continue;

		const [inserted] = await db
			.insert(notifications)
			.values({
				tenantId: inv.lease.tenant.id,
				invoiceId: inv.id,
				type: "reminder",
				status: "pending",
			})
			.returning({ id: notifications.id });

		ids.push(inserted.id);
	}

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

	console.log("%d reminders created", count);
}
