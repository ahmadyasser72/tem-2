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
		const value = await db.query.auditLogs.findFirst({
			columns: { id: true, tableName: true, action: true, recordId: true },
			where: { id },
		});
		if (!value) {
			console.error("audit.remove: audit log not found", { id });
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Audit log tidak ditemukan.",
			});
		}

		await db.delete(auditLogs).where(eq(auditLogs.id, id));

		await context.locals.logAudit(
			"DELETE",
			"audit_logs",
			id,
			auditDetail.delete(`Menghapus audit log dengan ID: ${id}`, value),
		);

		return { success: true, id };
	},
});
