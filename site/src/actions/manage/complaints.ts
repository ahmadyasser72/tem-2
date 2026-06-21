import { db, eq } from "@e-kos/database";
import { auditDetail, auditLogs, complaints } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { omit } from "es-toolkit";

export const resolve = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		resolveNotes: z
			.string()
			.optional()
			.transform((s) => s?.trim() ?? null),
	}),
	handler: async (input, context) => {
		const user = await context.session?.get("user");
		if (!user?.id) {
			throw new ActionError({
				code: "UNAUTHORIZED",
				message: "Sesi tidak valid. Harap login kembali.",
			});
		}

		const complaint = await db.query.complaints.findFirst({
			columns: { id: true, status: true, resolveNotes: true, resolvedBy: true },
			where: { id: input.id },
		});
		if (!complaint?.id) {
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
			details: auditDetail.update(
				`Menyelesaikan komplain dengan catatan: ${input.resolveNotes || "-"}`,
				omit(complaint, ["id"]),
				{
					status: "resolved",
					resolveNotes: input.resolveNotes,
					resolvedBy: user.id,
				},
			),
		});

		return updated;
	},
});
