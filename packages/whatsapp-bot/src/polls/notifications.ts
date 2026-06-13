import { db, eq } from "@e-kos/database";
import { auditLogs, notifications } from "@e-kos/database/schema";

import type { WASocket } from "baileys";

export async function pollNotifications(sock: WASocket, botUserId: number) {
	const pending = await db.query.notifications.findMany({
		where: { status: "pending" },
	});

	for (const n of pending) {
		try {
			const tenant = await db.query.tenants.findFirst({
				where: { id: n.tenantId },
			});

			if (!tenant?.phoneNumber) {
				// Tidak ada nomor HP — tandai failed agar tidak ditarik lagi
				await db
					.update(notifications)
					.set({ status: "failed" })
					.where(eq(notifications.id, n.id));
				continue;
			}

			let msg: string;

			if (n.type === "payment_success") {
				// ─── Payment success message ─────────────────────
				msg = `*✅ Pembayaran Diterima*\n\n`;
				msg += `Yth. ${tenant.fullName},\n\n`;

				if (n.invoiceId) {
					const invoiceData = await db.query.invoices.findFirst({
						where: { id: n.invoiceId },
						with: { lease: { with: { room: true } } },
					});

					if (invoiceData?.lease?.room) {
						msg += `📍 Kamar: ${invoiceData.lease.room.roomNumber}\n`;
						msg += `💰 Jumlah: Rp ${invoiceData.amount.toLocaleString()}\n`;
						msg += `📅 Pembayaran: ${invoiceData.dueDate.toLocaleDateString()}\n\n`;
					}
				}

				msg += `Terima kasih telah membayar tepat waktu.`;
			} else {
				// ─── Reminder / default message ──────────────────
				msg = `*🔔 Pengingat Pembayaran*\n\n`;
				msg += `Yth. ${tenant.fullName},\n`;
				msg += `Tagihan sewa Anda akan segera jatuh tempo.\n\n`;

				if (n.invoiceId) {
					const invoiceData = await db.query.invoices.findFirst({
						where: { id: n.invoiceId },
						with: { lease: { with: { room: true } } },
					});

					if (invoiceData?.lease?.room) {
						msg += `📍 Kamar: ${invoiceData.lease.room.roomNumber}\n`;
						msg += `💰 Jumlah: Rp ${invoiceData.amount.toLocaleString()}\n`;
						msg += `📅 Batas bayar: ${invoiceData.dueDate.toLocaleDateString()}\n\n`;

						// Sertakan payment link jika ada
						if (invoiceData.duitkuReference) {
							const baseUrl =
								process.env.DUITKU_BASE_URL?.replace("api", "app") ??
								"https://app-sandbox.duitku.com";
							const paymentUrl = `${baseUrl}/redirect_checkout?reference=${invoiceData.duitkuReference}`;
							msg += `💳 Bayar sekarang: ${paymentUrl}\n\n`;
						}
					}
				}

				msg += `Silakan lakukan pembayaran tepat waktu.\n`;
				msg += `Ketik *tagihan* untuk info lebih lanjut.`;
				msg += `\n\n_Pesan ini dikirim otomatis oleh sistem._`;
			}

			await sock.sendMessage(`${tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			await db
				.update(notifications)
				.set({ status: "sent" })
				.where(eq(notifications.id, n.id));

			const actionDesc =
				n.type === "payment_success"
					? `Bot mengirim konfirmasi pembayaran sukses ke tenant #${tenant.id} (${tenant.phoneNumber})`
					: `Bot mengirim pengingat pembayaran ke tenant #${tenant.id} (${tenant.phoneNumber})`;

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "INSERT",
				tableName: "notifications",
				details: actionDesc,
			});
		} catch (err) {
			console.error("[Bot] Send notification failed:", err);
			await db
				.update(notifications)
				.set({ status: "failed" })
				.where(eq(notifications.id, n.id));
		}
	}
}
