import { db, eq } from "@e-kos/database";
import {
	generatePaymentLink as createPaymentLink,
	DuitkuError,
	InvoicePaymentError,
} from "@e-kos/database/duitku/invoice-payment";
import { auditDetail, invoices, notifications } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { isError } from "es-toolkit/predicate";

export const generatePaymentLink = defineAction({
	accept: "form",
	input: z.object({
		invoice_id: z.coerce.number(),
	}),
	handler: async (input, context) => {
		try {
			return await createPaymentLink(
				input.invoice_id,
				context.url.origin,
				context.locals.user?.id,
			);
		} catch (err) {
			if (err instanceof InvoicePaymentError) {
				throw new ActionError({
					code: "BAD_REQUEST",
					message: err.message,
				});
			}
			if (err instanceof DuitkuError) {
				throw new ActionError({
					code: "BAD_REQUEST",
					message: `Duitku: ${err.message}`,
				});
			}
			if (isError(err)) {
				throw new ActionError({
					code: "BAD_REQUEST",
					message: err.message,
				});
			}
			throw new ActionError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Gagal membuat link pembayaran.",
			});
		}
	},
});

export const markAsPaid = defineAction({
	accept: "form",
	input: z.object({
		invoice_id: z.coerce.number(),
	}),
	handler: async (input, context) => {
		const invoiceId = input.invoice_id;

		const invoice = await db.query.invoices.findFirst({
			where: { id: invoiceId },
			with: { lease: { with: { tenant: true } } },
		});

		if (!invoice) {
			console.error("invoices.markAsPaid: invoice not found", { invoiceId });
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Invoice tidak ditemukan.",
			});
		}

		if (invoice.status === "paid") {
			console.error("invoices.markAsPaid: already paid", { invoiceId });
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice sudah lunas.",
			});
		}

		await db
			.update(invoices)
			.set({ status: "paid", paidAt: new Date() })
			.where(eq(invoices.id, invoiceId));

		if (invoice.lease?.tenant) {
			await db.insert(notifications).values({
				tenantId: invoice.lease.tenant.id,
				invoiceId: invoice.id,
				type: "payment_success",
				status: "pending",
			});
		}

		await context.locals.logAudit(
			"UPDATE",
			"invoices",
			invoiceId,
			auditDetail.payment(
				`Manual: Menandai invoice #${invoiceId} sebagai lunas`,
				invoice.amount,
				"manual",
			),
		);

		return { success: true };
	},
});
