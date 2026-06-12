import { db } from "@e-kos/database";
import { tenants } from "@e-kos/database/schema";

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

	const STATUS_LABEL: Record<string, string> = {
		open: "📩 Menunggu",
		in_progress: "🔧 Diproses",
		resolved: "✅ Selesai",
	};

	const lines: string[] = [];
	lines.push(`*📋 Daftar Komplain (${latest.length} terbaru)*`);
	lines.push("");

	for (const c of latest) {
		lines.push("━━━━━━━━━━━━━━━━━━━");
		lines.push(`🆔 #${c.id}`);
		lines.push(`📝 ${c.description}`);
		lines.push(`📅 ${c.createdAt.toLocaleDateString()}`);
		lines.push(`${STATUS_LABEL[c.status] ?? c.status}`);
		lines.push("");
	}

	lines.push(`Ketik *komplainku ${latest[0].id}* untuk info lebih lanjut.`);
	return lines.join("\n");
}
