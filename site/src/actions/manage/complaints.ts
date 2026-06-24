import { db, eq } from "@e-kos/database";
import { auditDetail, complaints } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const resolve = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		resolveNotes: z
			.string()
			.optional()
			.transform((s) => s?.trim() ?? null),
	}),
	handler: async ({ id, resolveNotes }, context) => {
		if (!context.locals.user?.id) {
			console.error("complaints.resolve: invalid session");
			throw new ActionError({
				code: "UNAUTHORIZED",
				message: "Sesi tidak valid. Harap login kembali.",
			});
		}

		const complaint = await db.query.complaints.findFirst({
			columns: { id: true, status: true, resolveNotes: true, resolvedBy: true },
			where: { id },
		});
		if (!complaint?.id) {
			console.error("complaints.resolve: complaint not found", {
				id,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Komplain tidak ditemukan.",
			});
		}

		const [updated] = await db
			.update(complaints)
			.set({
				status: "resolved",
				resolvedBy: context.locals.user.id,
				resolveNotes,
			})
			.where(eq(complaints.id, id))
			.returning({ id: complaints.id });

		await context.locals.logAudit(
			"UPDATE",
			"complaints",
			updated.id,
			auditDetail.update(
				`Menyelesaikan komplain dengan catatan: ${resolveNotes || "-"}`,
				{
					status: complaint.status,
					resolveNotes: complaint.resolveNotes,
					resolvedBy: complaint.resolvedBy,
				},
				{
					status: "resolved",
					resolveNotes,
					resolvedBy: context.locals.user.id,
				},
			),
		);

		return updated;
	},
});
