import { db } from "@e-kos/database";
import { notifications } from "@e-kos/database/schema";

const now = new Date();
const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

const dueInvoices = await db.query.invoices.findMany({
	where: {
		status: "unpaid",
		dueDate: { gte: now, lte: threeDaysLater },
	},
	with: {
		lease: {
			with: {
				tenant: true,
			},
		},
	},
});

let count = 0;

for (const inv of dueInvoices) {
	if (!inv.lease?.tenant) continue;

	await db.insert(notifications).values({
		tenantId: inv.lease.tenant.id,
		invoiceId: inv.id,
		type: "reminder",
		status: "pending",
	});

	count++;
}

console.log(`[Cron] ${count} reminders created`);
