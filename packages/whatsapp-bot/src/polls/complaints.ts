import { db, eq } from "@e-kos/database";
import { auditDetail, auditLogs, complaints } from "@e-kos/database/schema";

import type { WASocket } from "baileys";

export async function pollResolvedComplaints(
	sock: WASocket,
	botUserId: number,
) {
	const resolved = await db.query.complaints.findMany({
		where: { status: "resolved", resolvedAt: { isNull: true } },
	});

	for (const complaint of resolved) {
		try {
			const tenant = await db.query.tenants.findFirst({
				where: { id: complaint.tenantId },
			});

			if (!tenant?.phoneNumber) continue;

			let resolverName = "Staf";
			if (complaint.resolvedBy) {
				const resolver = await db.query.users.findFirst({
					where: { id: complaint.resolvedBy },
				});
				if (resolver) resolverName = resolver.displayName ?? resolver.username;
			}

			const lines: string[] = [];
			lines.push("*✅ Komplain Selesai Diproses*");
			lines.push("");
			lines.push(`Yth. ${tenant.fullName},`);
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
			lines.push(`👤 Ditangani oleh: ${resolverName}`);
			lines.push("━━━━━━━━━━━━━━━━━━━");
			lines.push("");
			lines.push("Terima kasih atas laporannya.");
			lines.push("Jika ada kendala lain, silakan hubungi kami kembali.");
			const msg = lines.join("\n");

			await sock.sendMessage(`${tenant.phoneNumber}@s.whatsapp.net`, {
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
					`Bot memberitahu tenant #${tenant.id} bahwa komplain #${complaint.id} selesai diproses`,
					"whatsapp",
					tenant.id,
				),
			});

			console.log(
				`Complaint #${complaint.id} resolved notified to ${tenant.phoneNumber}`,
			);
		} catch (err) {
			console.error(
				`Complaint #${complaint.id} resolved notification failed:`,
				err,
			);
		}
	}
}
