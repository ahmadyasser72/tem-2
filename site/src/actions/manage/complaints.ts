import { db, eq } from "@e-kos/database";
import { complaints, auditLogs } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const resolve = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		resolveNotes: z.string().transform((val) => val.trim() || null).optional(),
	}),
	handler: async (input, context) => {
		const user = await context.session?.get("user");
		if (!user?.id) {
			throw new ActionError({
				code: "UNAUTHORIZED",
				message: "Sesi tidak valid. Harap login kembali.",
			});
		}

		const exists = await db.query.complaints.findFirst({
			columns: { id: true },
			where: { id: input.id },
		});
		if (!exists?.id) {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Komplain tidak ditemukan.",
			});
		}

		const [updated] = await db
			.update(complaints)
			.set({
				status: "resolved",
				resolvedBy: user.id,
				resolveNotes: input.resolveNotes,
			})
			.where(eq(complaints.id, input.id))
			.returning({ id: complaints.id });

		await db.insert(auditLogs).values({
			userId: user.id,
			action: "UPDATE",
			tableName: "complaints",
			recordId: updated.id,
			details: `Menyelesaikan komplain dengan catatan: ${input.resolveNotes || "-"}`,
		});

		return updated;
	},
});
