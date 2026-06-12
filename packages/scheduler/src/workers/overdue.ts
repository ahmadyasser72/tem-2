import { and, db, eq, sql } from "@e-kos/database";
import { invoices } from "@e-kos/database/schema";

const now = Math.floor(Date.now() / 1000);

await db
	.update(invoices)
	.set({ status: "overdue" })
	.where(and(eq(invoices.status, "unpaid"), sql`${invoices.dueDate} < ${now}`));

console.log("[Cron] Overdue invoices updated", new Date().toISOString());
