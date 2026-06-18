import { and, db, eq, sql } from "@e-kos/database";
import { auditLogs, invoices, users } from "@e-kos/database/schema";

export async function runOverdueCheck(
	systemUser: typeof users.$inferSelect,
	now?: Date,
) {
	const ref = now ?? new Date();
	const nowTs = Math.floor(ref.getTime() / 1000);

	const overdue = await db.query.invoices.findMany({
		where: { status: "unpaid" },
	});

	const filtered = overdue.filter(
		(inv) => inv.dueDate.getTime() / 1000 < nowTs,
	);

	if (filtered.length > 0) {
		const ids = filtered.map((inv) => inv.id);

		await db
			.update(invoices)
			.set({ status: "overdue" })
			.where(
				and(eq(invoices.status, "unpaid"), sql`${invoices.dueDate} < ${nowTs}`),
			);

		await db.insert(auditLogs).values({
			userId: systemUser.id,
			action: "UPDATE",
			tableName: "invoices",
			details: `Cron marked ${filtered.length} invoice(s) as overdue (IDs: ${ids.join(", ")})`,
		});
	}

	console.log("[Cron] Overdue invoices updated: %d", filtered.length);
}
