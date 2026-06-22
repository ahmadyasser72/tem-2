import { db } from "@e-kos/database";
import { botAuth } from "@e-kos/database/schema";

async function logout() {
	const rows = await db.delete(botAuth).returning();

	if (rows.length === 0) {
		console.log("Tidak ada sesi WhatsApp yang aktif.");
	} else {
		console.log(`Sesi WhatsApp telah dihapus (${rows.length} data auth).`);
	}

	process.exit(0);
}

logout();
