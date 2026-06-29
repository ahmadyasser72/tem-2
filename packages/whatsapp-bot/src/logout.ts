import { db } from "@indekos/database";
import { botAuth } from "@indekos/database/schema";

const logout = async () => {
	const rows = await db.delete(botAuth).returning();

	if (rows.length === 0) {
		console.log("Tidak ada sesi WhatsApp yang aktif.");
	} else {
		console.log(`Sesi WhatsApp telah dihapus (${rows.length} data auth).`);
	}

	process.exit(0);
};

logout();
