import { db, eq } from "@e-kos/database";
import { auditDetail, complaints } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { omit } from "es-toolkit";

export const process = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const complaint = await db.query.complaints.findFirst({
			columns: { id: true, status: true },
			where: { id },
		});
		if (!complaint?.id) {
			console.error("complaints.process: complaint not found", { id });
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Komplain tidak ditemukan.",
			});
		}

		if (complaint.status !== "open") {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Hanya komplain dengan status 'Terbuka' yang dapat diproses.",
			});
		}

		const [updated] = await db
			.update(complaints)
			.set({ status: "in_progress" })
			.where(eq(complaints.id, id))
			.returning({ id: complaints.id });

		await context.locals.logAudit(
			"UPDATE",
			"complaints",
			updated.id,
			auditDetail.update(
				`Memproses komplain`,
				{ status: complaint.status },
				{ status: "in_progress" },
			),
		);

		return updated;
	},
});

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
				resolvedBy: context.locals.user!.id,
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
				omit(complaint, ["id"]),
				{
					status: "resolved",
					resolveNotes,
					resolvedBy: context.locals.user!.id,
				},
			),
		);

		return updated;
	},
});
