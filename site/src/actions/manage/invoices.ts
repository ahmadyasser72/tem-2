import { db, eq } from "@e-kos/database";
import {
	createInvoice as duitkuCreateInvoice,
	DuitkuError,
	getPaymentUrlFromReference,
} from "@e-kos/database/duitku";
import {
	auditDetail,
	auditLogs,
	invoices,
	notifications,
} from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { isError } from "es-toolkit/predicate";

// ─── Generate Payment Link ──────────────────────────────────────
export const generatePaymentLink = defineAction({
	accept: "form",
	input: z.object({
		invoice_id: z.coerce.number(),
	}),
	handler: async (input, context) => {
		const invoiceId = input.invoice_id;

		// 1. Cari invoice + lease + tenant
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
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Invoice tidak ditemukan.",
			});
		}

		// 2. Jika sudah lunas
		if (invoice.status === "paid") {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice sudah lunas.",
			});
		}

		if (!invoice.lease) {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice tidak memiliki data sewa.",
			});
		}

		if (!invoice.lease.isActive) {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Sewa sudah tidak aktif.",
			});
		}

		if (!invoice.lease.tenant) {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Data penghuni tidak ditemukan.",
			});
		}

		const tenant = invoice.lease.tenant;
		const room = invoice.lease.room;

		if (!tenant.phoneNumber) {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor HP penghuni tidak terisi.",
			});
		}

		// 3. Jika sudah punya duitkuReference → return paymentUrl yang tersimpan
		if (invoice.duitkuReference) {
			return {
				paymentUrl: getPaymentUrlFromReference(invoice.duitkuReference),
				reference: invoice.duitkuReference,
				alreadyExists: true,
			};
		}

		// 4. Generate payment link baru
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

			// 5. Simpan reference
			await db
				.update(invoices)
				.set({ duitkuReference: result.reference })
				.where(eq(invoices.id, invoiceId));

			// 6. Catat audit log
			const user = await context.session?.get("user");
			await db.insert(auditLogs).values({
				userId: user?.id ?? null,
				action: "UPDATE",
				tableName: "invoices",
				recordId: invoiceId,
				details: auditDetail.payment(
					`Generate payment link Duitku: Ref ${result.reference} untuk ${tenant.fullName} (${roomNumber}) - Rp ${invoice.amount.toLocaleString("id-ID")}`,
					invoice.amount,
					result.reference,
				),
			});

			return {
				paymentUrl: result.paymentUrl,
				reference: result.reference,
				alreadyExists: false,
			};
		} catch (err) {
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

// ─── Mark as Paid (manual override) ─────────────────────────────
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
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Invoice tidak ditemukan.",
			});
		}

		if (invoice.status === "paid") {
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Invoice sudah lunas.",
			});
		}

		await db
			.update(invoices)
			.set({ status: "paid" })
			.where(eq(invoices.id, invoiceId));

		// Buat notification untuk tenant
		if (invoice.lease?.tenant) {
			await db.insert(notifications).values({
				tenantId: invoice.lease.tenant.id,
				invoiceId: invoice.id,
				type: "payment_success",
				status: "pending",
			});
		}

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "UPDATE",
			tableName: "invoices",
			recordId: invoiceId,
			details: auditDetail.payment(
				`Manual: Menandai invoice #${invoiceId} sebagai lunas`,
				invoice.amount,
				"manual",
			),
		});

		return { success: true };
	},
});
