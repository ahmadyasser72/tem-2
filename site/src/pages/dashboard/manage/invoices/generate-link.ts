import { db, eq } from "@e-kos/database";
import { invoices } from "@e-kos/database/schema";
import {
	createInvoice as duitkuCreateInvoice,
	DuitkuError,
} from "@e-kos/database/duitku";

import type { APIRoute } from "astro";

// /dashboard/manage/invoices/generate-link
// HTMX endpoint — returns redirect to the transactions page with status

export const POST: APIRoute = async ({ request, redirect }) => {
	const formData = await request.formData();
	const invoiceIdRaw = formData.get("invoice_id");
	const invoiceId = Number(invoiceIdRaw);

	if (!invoiceId || Number.isNaN(invoiceId)) {
		return redirect(
			"/dashboard/report/transactions?statusMsg=error&statusDetail=ID+invoice+tidak+valid",
		);
	}

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
		return redirect(
			"/dashboard/report/transactions?statusMsg=error&statusDetail=Invoice+tidak+ditemukan",
		);
	}

	if (invoice.status === "paid") {
		return redirect(
			"/dashboard/report/transactions?statusMsg=error&statusDetail=Invoice+sudah+lunas",
		);
	}

	if (!invoice.lease?.isActive) {
		return redirect(
			"/dashboard/report/transactions?statusMsg=error&statusDetail=Sewa+sudah+tidak+aktif",
		);
	}

	if (!invoice.lease?.tenant?.phoneNumber) {
		return redirect(
			"/dashboard/report/transactions?statusMsg=error&statusDetail=Nomor+HP+penghuni+tidak+terisi",
		);
	}

	// Jika sudah punya reference, pakai yang lama
	if (invoice.duitkuReference) {
		return redirect(
			`/dashboard/report/transactions?statusMsg=success&statusDetail=Link+pembayaran+sudah+ada&paymentUrl=https://app-sandbox.duitku.com/redirect_checkout?reference=${invoice.duitkuReference}`,
		);
	}

	// Generate baru
	const tenant = invoice.lease.tenant;
	const room = invoice.lease.room;
	const merchantOrderId = `INV-${invoice.id.toString().padStart(6, "0")}`;
	const roomNumber = room?.roomNumber ?? "-";
	const baseUrl = process.env.SITE_BASE_URL ?? "http://localhost:4321";

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
			returnUrl: `${baseUrl}/api/duitku/redirect`,
			callbackUrl: `${baseUrl}/api/duitku/callback`,
			expiryPeriod: 1440,
			paymentMethod: "",
		});

		// Simpan duitkuReference
		await db
			.update(invoices)
			.set({ duitkuReference: result.reference })
			.where(eq(invoices.id, invoiceId));

		return redirect(
			`/dashboard/report/transactions?statusMsg=success&statusDetail=Link+pembayaran+berhasil+dibuat&paymentUrl=${encodeURIComponent(result.paymentUrl)}`,
		);
	} catch (err) {
		const msg =
			err instanceof DuitkuError
				? err.message
				: (err as Error).message ?? "Gagal membuat link pembayaran";
		return redirect(
			`/dashboard/report/transactions?statusMsg=error&statusDetail=${encodeURIComponent(msg)}`,
		);
	}
};
