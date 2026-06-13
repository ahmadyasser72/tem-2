import { db } from "@e-kos/database";
import { tenants } from "@e-kos/database/schema";

export async function checkBills(
	tenant: typeof tenants.$inferSelect,
): Promise<string> {
	const activeLease = await db.query.leases.findFirst({
		where: { tenantId: tenant.id, isActive: true },
		with: {
			room: true,
			invoices: {
				where: { status: "unpaid" },
			},
		},
	});

	if (!activeLease?.room) {
		return "📍 Anda tidak memiliki kontrak sewa yang aktif.";
	}

	const unpaid = activeLease.invoices ?? [];
	const total = unpaid.reduce((sum, inv) => sum + inv.amount, 0);

	function getPaymentUrl(reference: string): string {
		const baseUrl =
			process.env.DUITKU_BASE_URL?.replace("api", "app") ??
			"https://app-sandbox.duitku.com";
		return `${baseUrl}/redirect_checkout?reference=${reference}`;
	}

	const lines: string[] = [];
	lines.push("*💰 Info Tagihan*");
	lines.push("");
	lines.push(`📍 Kamar: ${activeLease.room.roomNumber}`);
	lines.push(`🏠 Tipe: ${activeLease.room.roomType ?? "-"}`);
	lines.push(
		`💰 Sewa/bulan: Rp ${activeLease.room.monthlyPrice.toLocaleString()}`,
	);
	lines.push("");

	if (unpaid.length === 0) {
		lines.push("✅ *Semua pembayaran lunas!*");
		lines.push("Terima kasih telah membayar tepat waktu.");
	} else {
		lines.push(`⚠️ *${unpaid.length} tagihan belum dibayar*`);
		lines.push("━━━━━━━━━━━━━━━━━━━");

		for (const inv of unpaid) {
			const invWithRef = await db.query.invoices.findFirst({
				where: { id: inv.id },
			});

			lines.push(`• Invoice #${inv.id}`);
			lines.push(`  Jumlah: Rp ${inv.amount.toLocaleString()}`);
			lines.push(`  Jatuh tempo: ${inv.dueDate.toLocaleDateString()}`);
			if (invWithRef?.duitkuReference) {
				lines.push(`  💳 Bayar: ${getPaymentUrl(invWithRef.duitkuReference)}`);
			}
			lines.push("");
		}
		lines.push("━━━━━━━━━━━━━━━━━━━");
		lines.push(`💰 *Total: Rp ${total.toLocaleString()}*`);
		lines.push("");

		if (!unpaid.some((inv) => inv.duitkuReference)) {
			lines.push("Silakan hubungi admin untuk mendapatkan link pembayaran.");
		}
	}

	return lines.join("\n");
}
