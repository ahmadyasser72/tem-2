import { db } from "@e-kos/database";
import { tenants } from "@e-kos/database/schema";

import { STATUS_LABEL } from "./constants";

export async function listComplaints(
	tenant: typeof tenants.$inferSelect,
): Promise<string> {
	const latest = await db.query.complaints.findMany({
		where: { tenantId: tenant.id },
		limit: 3,
	});

	if (latest.length === 0) {
		return "Belum ada komplain yang Anda kirimkan.";
	}

	const lines: string[] = [];
	lines.push(`*📋 Daftar Komplain (${latest.length} terbaru)*`);
	lines.push("");

	for (const complaint of latest) {
		lines.push("━━━━━━━━━━━━━━━━━━━");
		lines.push(`🆔 #${complaint.id}`);
		lines.push(`📝 ${complaint.description}`);
		lines.push(`📅 ${complaint.createdAt.toLocaleDateString()}`);
		lines.push(`${STATUS_LABEL[complaint.status]}`);
		lines.push("");
	}

	lines.push(`Ketik *komplainku ${latest[0].id}* untuk info lebih lanjut.`);
	return lines.join("\n");
}
