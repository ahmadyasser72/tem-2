import { db, eq } from "@e-kos/database";
import { getPaymentUrlFromReference } from "@e-kos/database/duitku";
import {
	auditDetail,
	auditLogs,
	chatbotMessages,
	notifications,
} from "@e-kos/database/schema";
import { formatDate } from "@e-kos/utilities/date";
import { formatCurrency } from "@e-kos/utilities/transforms";

import type { WASocket } from "baileys";

import { render } from "../template";

export const pollNotifications = async (sock: WASocket, botUserId: number) => {
	const pending = await db.query.notifications.findMany({
		where: { status: "pending" },
	});

	for (const notification of pending) {
		try {
			const tenant = await db.query.tenants.findFirst({
				where: { id: notification.tenantId },
			});

			if (!tenant?.phoneNumber) {
				await db
					.update(notifications)
					.set({ status: "failed" })
					.where(eq(notifications.id, notification.id));
				continue;
			}

			// Hoist shared invoice + lease + room query
			const invoiceData = notification.invoiceId
				? await db.query.invoices.findFirst({
						where: { id: notification.invoiceId },
						with: { lease: { with: { room: true } } },
					})
				: undefined;

			let msg: string;
			if (notification.type === "welcome") {
				const lease = await db.query.leases.findFirst({
					where: { tenantId: notification.tenantId, isActive: true },
					with: { room: true },
				});

				msg = render("welcome", {
					fullName: tenant.fullName,
					roomNumber: lease?.room?.roomNumber ?? null,
				});
			} else if (notification.type === "payment_success") {
				msg = render("payment-success", {
					fullName: tenant.fullName,
					roomNumber: invoiceData?.lease?.room?.roomNumber ?? null,
					amount: invoiceData ? formatCurrency(invoiceData.amount) : null,
					date: invoiceData ? formatDate(invoiceData.dueDate) : null,
				});
			} else {
				msg = render("payment-reminder", {
					fullName: tenant.fullName,
					roomNumber: invoiceData?.lease?.room?.roomNumber ?? null,
					amount: invoiceData ? formatCurrency(invoiceData.amount) : null,
					dueDate: invoiceData ? formatDate(invoiceData.dueDate) : null,
					paymentUrl: invoiceData?.duitkuReference
						? getPaymentUrlFromReference(invoiceData.duitkuReference)
						: null,
				});
			}

			await sock.sendMessage(`${tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			const [sent] = await db
				.insert(chatbotMessages)
				.values({
					tenantId: notification.tenantId,
					direction: "outgoing",
					message: msg,
				})
				.returning({ id: chatbotMessages.id });

			await db
				.update(notifications)
				.set({ status: "sent", chatbotMessageId: sent.id })
				.where(eq(notifications.id, notification.id));

			const actionDesc =
				notification.type === "welcome"
					? `Bot mengirim pesan selamat datang ke tenant #${tenant.id}`
					: notification.type === "payment_success"
						? `Bot mengirim konfirmasi pembayaran sukses ke tenant #${tenant.id}`
						: `Bot mengirim pengingat pembayaran ke tenant #${tenant.id}`;

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "CREATE",
				tableName: "notifications",
				details: auditDetail.notification(actionDesc, "whatsapp", tenant.id),
			});
		} catch (err) {
			console.error("Send notification failed:", err);
			await db
				.update(notifications)
				.set({ status: "failed" })
				.where(eq(notifications.id, notification.id));
		}
	}
};
