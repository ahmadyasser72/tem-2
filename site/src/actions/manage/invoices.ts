import { db, eq } from "@e-kos/database";
import {
	createInvoice as duitkuCreateInvoice,
	DuitkuError,
	getPaymentUrlFromReference,
} from "@e-kos/database/duitku";
import { auditDetail, invoices, notifications } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { isError } from "es-toolkit/predicate";

import { formatCurrency } from "~/lib/transforms";

export const generatePaymentLink = defineAction({
	accept: "form",
	input: z.object({
		invoice_id: z.coerce.number(),
	}),
	handler: async (input, context) => {
		const invoiceId = input.invoice_id;

		const invoice = await db.query.invoices.findFirst({
			where: { id: invoiceId },
			with: {
				lease: {
					with: {
						tenant: true,
						room: true,
					},
				},
			},
		});

		if (!invoice) {
			console.error("invoices.generatePaymentLink: invoice not found", {
				invoiceId,
			});
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Invoice tidak ditemukan.",
			});
		}

		if (invoice.status === "paid") {
			console.error("invoices.generatePaymentLink: already paid", {
				invoiceId,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice sudah lunas.",
			});
		}

		if (!invoice.lease) {
			console.error("invoices.generatePaymentLink: no lease", { invoiceId });
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice tidak memiliki data sewa.",
			});
		}

		if (!invoice.lease.isActive) {
			console.error("invoices.generatePaymentLink: lease not active", {
				invoiceId,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Sewa sudah tidak aktif.",
			});
		}

		if (!invoice.lease.tenant) {
			console.error("invoices.generatePaymentLink: tenant not found", {
				invoiceId,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Data penghuni tidak ditemukan.",
			});
		}

		const tenant = invoice.lease.tenant;
		const room = invoice.lease.room;

		if (!tenant.phoneNumber) {
			console.error("invoices.generatePaymentLink: tenant has no phone", {
				invoiceId,
				tenantId: tenant.id,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor HP penghuni tidak terisi.",
			});
		}

		if (invoice.duitkuReference) {
			return {
				paymentUrl: getPaymentUrlFromReference(invoice.duitkuReference),
				reference: invoice.duitkuReference,
				alreadyExists: true,
			};
		}

		const merchantOrderId = `INV-${invoice.id.toString().padStart(6, "0")}`;
		const roomNumber = room?.roomNumber ?? "-";
		const baseUrl = new URL(context.url.origin);

		try {
			const result = await duitkuCreateInvoice({
				paymentAmount: invoice.amount,
				merchantOrderId,
				productDetails: `Pembayaran Sewa Kamar ${roomNumber}`,
				customerVaName: tenant.fullName,
				phoneNumber: tenant.phoneNumber,
				itemDetails: [
					{
						name: `Sewa Kamar ${roomNumber}`,
						price: invoice.amount,
						quantity: 1,
					},
				],
				customerDetail: {
					firstName: tenant.fullName,
					phoneNumber: tenant.phoneNumber,
				},
				returnUrl: new URL("/api/duitku/redirect", baseUrl).href,
				callbackUrl: new URL("/api/duitku/callback", baseUrl).href,
				expiryPeriod: 1440, // 24 jam
				paymentMethod: "",
			});

			await db
				.update(invoices)
				.set({ duitkuReference: result.reference })
				.where(eq(invoices.id, invoiceId));

			await context.locals.logAudit(
				"UPDATE",
				"invoices",
				invoiceId,
				auditDetail.payment(
					`Generate payment link Duitku: Ref ${result.reference} untuk ${tenant.fullName} (${roomNumber}) - ${formatCurrency(invoice.amount)}`,
					invoice.amount,
					result.reference,
				),
			);

			return {
				paymentUrl: result.paymentUrl,
				reference: result.reference,
				alreadyExists: false,
			};
		} catch (err) {
			console.error("invoices.generatePaymentLink: failed", {
				invoiceId,
				error: err instanceof Error ? err.message : err,
			});
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
			.set({ status: "paid" })
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
