import { db, eq } from "@e-kos/database";
import { auditDetail, auditLogs } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const remove = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const user = await context.session?.get("user");
		const userId = user?.id ?? null;

		const value = await db.query.auditLogs.findFirst({
			columns: { id: true, tableName: true, action: true, recordId: true },
			where: { id },
		});
		if (!value) {
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Audit log tidak ditemukan.",
			});
		}

		await db.delete(auditLogs).where(eq(auditLogs.id, id));

		await db.insert(auditLogs).values({
			userId,
			action: "DELETE",
			tableName: "audit_logs",
			recordId: id,
			details: auditDetail.delete(
				`Menghapus audit log dengan ID: ${id}`,
				value,
			),
		});

		return { success: true, id };
	},
});
