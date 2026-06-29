import { db, eq } from "@e-kos/database";
import { auditDetail, auditLogs, complaints } from "@e-kos/database/schema";

import type { WASocket } from "baileys";

export async function pollInProgressComplaints(
	sock: WASocket,
	botUserId: number,
) {
	const inProgress = await db.query.complaints.findMany({
		where: { status: "in_progress", processedAt: { isNull: true } },
		with: { tenant: true },
	});

	for (const complaint of inProgress) {
		try {
			const lines: string[] = [];
			lines.push("*🔄 Komplain Sedang Diproses*");
			lines.push("");
			lines.push(`Yth. ${complaint.tenant.fullName},`);
			lines.push("");
			lines.push(
				`Laporan komplain Anda sedang dalam proses penanganan oleh staf kami.`,
			);
			lines.push("");
			lines.push("📋 *Detail*");
			lines.push("━━━━━━━━━━━━━━━━━━━");
			lines.push(`🆔 ID Laporan: #${complaint.id}`);
			lines.push(`📝 Keluhan: ${complaint.description}`);
			lines.push("━━━━━━━━━━━━━━━━━━━");
			lines.push("");
			lines.push("Kami akan segera menyelesaikan laporan Anda. ");
			lines.push("Mohon menunggu informasi selanjutnya.");
			const msg = lines.join("\n");

			await sock.sendMessage(`${complaint.tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			await db
				.update(complaints)
				.set({ processedAt: new Date() })
				.where(eq(complaints.id, complaint.id));

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "CREATE",
				tableName: "notifications",
				details: auditDetail.notification(
					`Bot memberitahu tenant #${complaint.tenant.id} bahwa komplain #${complaint.id} sedang diproses`,
					"whatsapp",
					complaint.tenant.id,
				),
			});

			console.log(
				`Complaint #${complaint.id} in-progress notified to ${complaint.tenant.phoneNumber}`,
			);
		} catch (err) {
			console.error(
				`Complaint #${complaint.id} in-progress notification failed:`,
				err,
			);
		}
	}
}

export async function pollResolvedComplaints(
	sock: WASocket,
	botUserId: number,
) {
	const resolved = await db.query.complaints.findMany({
		where: { status: "resolved", resolvedAt: { isNull: true } },
		with: { tenant: true, resolver: true },
	});

	for (const complaint of resolved) {
		try {
			const lines: string[] = [];
			lines.push("*✅ Komplain Selesai Diproses*");
			lines.push("");
			lines.push(`Yth. ${complaint.tenant.fullName},`);
			lines.push("");
			lines.push(`Laporan komplain Anda telah selesai ditangani.`);
			lines.push("");
			lines.push("📋 *Detail*");
			lines.push("━━━━━━━━━━━━━━━━━━━");
			lines.push(`🆔 ID Laporan: #${complaint.id}`);
			lines.push(`📝 Keluhan: ${complaint.description}`);
			if (complaint.resolveNotes) {
				lines.push(`📌 Catatan: ${complaint.resolveNotes}`);
			}
			lines.push(
				`👤 Ditangani oleh: ${complaint.resolver?.displayName ?? "Staf"}`,
			);
			lines.push("━━━━━━━━━━━━━━━━━━━");
			lines.push("");
			lines.push("Terima kasih atas laporannya.");
			lines.push("Jika ada kendala lain, silakan hubungi kami kembali.");
			const msg = lines.join("\n");

			await sock.sendMessage(`${complaint.tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			await db
				.update(complaints)
				.set({ resolvedAt: new Date() })
				.where(eq(complaints.id, complaint.id));

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "CREATE",
				tableName: "notifications",
				details: auditDetail.notification(
					`Bot memberitahu tenant #${complaint.tenant.id} bahwa komplain #${complaint.id} selesai diproses`,
					"whatsapp",
					complaint.tenant.id,
				),
			});

			console.log(
				`Complaint #${complaint.id} resolved notified to ${complaint.tenant.phoneNumber}`,
			);
		} catch (err) {
			console.error(
				`Complaint #${complaint.id} resolved notification failed:`,
				err,
			);
		}
	}
}
