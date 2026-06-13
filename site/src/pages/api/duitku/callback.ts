import { db, eq } from "@e-kos/database";
import { config, verifyCallbackSignature } from "@e-kos/database/duitku";
import { auditLogs, invoices, notifications } from "@e-kos/database/schema";

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
	const formData = await request.formData();
	const params = Object.fromEntries(formData) as Record<string, string>;

	const {
		merchantCode,
		amount,
		merchantOrderId,
		signature,
		reference,
		resultCode,
	} = params;

	// ─── Validasi keberadaan parameter ───────────────────────────
	if (!merchantCode || !amount || !merchantOrderId || !signature) {
		console.error("[Duitku Callback] Missing required parameters");
		return new Response(null, { status: 400 });
	}

	// ─── Validasi signature ──────────────────────────────────────
	const { apiKey } = config();
	const parsedAmount = Number.parseInt(amount, 10);

	if (
		!verifyCallbackSignature(
			merchantCode,
			parsedAmount,
			merchantOrderId,
			signature,
			apiKey,
		)
	) {
		console.error("[Duitku Callback] Invalid signature");
		return new Response(null, { status: 400 });
	}

	// ─── Cari invoice ────────────────────────────────────────────
	// merchantOrderId format: INV-XXXXXX
	const invoiceIdStr = merchantOrderId.replace("INV-", "");
	const invoiceId = Number.parseInt(invoiceIdStr, 10);

	if (Number.isNaN(invoiceId)) {
		console.error(
			"[Duitku Callback] Invalid merchantOrderId format:",
			merchantOrderId,
		);
		return new Response(null, { status: 200 }); // Return 200 so Duitku doesn't retry
	}

	const invoice = await db.query.invoices.findFirst({
		where: { id: invoiceId },
		with: { lease: { with: { tenant: true, room: true } } },
	});

	if (!invoice) {
		console.error("[Duitku Callback] Invoice not found:", invoiceId);
		return new Response(null, { status: 200 }); // Acknowledge to Duitku
	}

	// ─── Idempotency check ───────────────────────────────────────
	if (invoice.callbackPayload) {
		console.log(
			"[Duitku Callback] Duplicate callback, skipping (invoice #%d)",
			invoiceId,
		);
		return new Response(null, { status: 200 });
	}

	// ─── Jika resultCode = "00" (Success) ────────────────────────
	if (resultCode === "00") {
		const rawPayload = JSON.stringify(params);

		try {
			db.transaction((tx) => {
				// Update invoice
				tx.update(invoices)
					.set({
						status: "paid",
						callbackPayload: rawPayload,
						duitkuReference: reference || invoice.duitkuReference,
					})
					.where(eq(invoices.id, invoiceId))
					.run();

				// Buat notification untuk tenant → bot akan polling
				tx.insert(notifications)
					.values({
						tenantId: invoice.lease!.tenantId,
						invoiceId: invoice.id,
						type: "payment_success",
						status: "pending",
					})
					.run();

				// Catat audit log
				tx.insert(auditLogs)
					.values({
						action: "UPDATE",
						tableName: "invoices",
						recordId: invoiceId,
						details: `Duitku callback: Pembayaran sukses (Ref: ${reference ?? invoice.duitkuReference}). Kamar: ${invoice.lease?.room?.roomNumber ?? "-"}, Tenant: ${invoice.lease?.tenant?.fullName ?? "-"}, Amount: ${parsedAmount}`,
					})
					.run();
			});

			console.log("[Duitku Callback] Invoice #%d marked as paid", invoiceId);
		} catch (err) {
			console.error("[Duitku Callback] Failed to update invoice:", err);
			return new Response(null, { status: 500 });
		}
	} else {
		console.log("[Duitku Callback] Non-success resultCode:", resultCode);
	}

	return new Response(null, { status: 200 });
};
