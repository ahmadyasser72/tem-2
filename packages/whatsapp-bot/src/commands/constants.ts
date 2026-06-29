import type { COMPLAINT_STATUS } from "@indekos/database/schema";

export const STATUS_LABEL = {
	open: "📩 Menunggu ditangani",
	in_progress: "🔧 Diproses",
	resolved: "✅ Selesai",
} satisfies Record<(typeof COMPLAINT_STATUS)[number], string>;
