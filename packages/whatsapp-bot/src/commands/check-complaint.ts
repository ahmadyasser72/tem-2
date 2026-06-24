import { db } from "@e-kos/database";
import { tenants } from "@e-kos/database/schema";

import { STATUS_LABEL } from "./status-labels";

export const checkComplaint = async (
	tenant: typeof tenants.$inferSelect,
	complaintId: number,
): Promise<string> => {
	const complaint = await db.query.complaints.findFirst({
		where: { id: complaintId, tenantId: tenant.id },
	});

	if (!complaint) {
		return "Komplain dengan ID tersebut tidak ditemukan.";
	}

	let resolverName = "-";
	if (complaint.resolvedBy) {
		const resolver = await db.query.users.findFirst({
			where: { id: complaint.resolvedBy },
		});
		if (resolver) resolverName = resolver.displayName ?? resolver.username;
	}

	const lines: string[] = [];
	lines.push(`*📋 Detail Komplain #${complaint.id}*`);
	lines.push("");
	lines.push("━━━━━━━━━━━━━━━━━━━");
	lines.push(`📝 Keluhan: ${complaint.description}`);
	lines.push(`📅 Tanggal: ${complaint.createdAt.toLocaleDateString()}`);
	lines.push(
		`📍 Status: ${STATUS_LABEL[complaint.status] ?? complaint.status}`,
	);

	if (complaint.resolveNotes) {
		lines.push(`📌 Catatan: ${complaint.resolveNotes}`);
	}
	if (complaint.resolvedBy) {
		lines.push(`👤 Ditangani oleh: ${resolverName}`);
	}
	lines.push("━━━━━━━━━━━━━━━━━━━");
	lines.push("");
	lines.push("Ketik *komplainku* untuk daftar komplain.");

	return lines.join("\n");
};
