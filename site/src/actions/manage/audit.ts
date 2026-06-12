import { db, eq } from "@e-kos/database";
import { auditLogs } from "@e-kos/database/schema";

import { defineAction } from "astro:actions";
import { z } from "astro/zod";

export const remove = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const user = await context.session?.get("user");
		const userId = user?.id ?? null;

		await db.delete(auditLogs).where(eq(auditLogs.id, id));

		await db.insert(auditLogs).values({
			userId,
			action: "DELETE",
			tableName: "audit_logs",
			recordId: id,
			details: `Menghapus audit log dengan ID: ${id}`,
		});

		return { success: true, id };
	},
});
