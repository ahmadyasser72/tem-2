import { db } from "@indekos/database";

import { logger } from "./logger";
import { runInvoiceGeneration } from "./workers/invoice-generation";
import { runMonthlyReport } from "./workers/monthly-report";
import { runOverdueCheck } from "./workers/overdue";
import { runOverdueReminder } from "./workers/overdue-reminder";
import { runPaymentReminder } from "./workers/payment-reminder";

const main = async () => {
	const systemUser = await db.query.users.findFirst({
		where: { username: "system" },
	});

	if (!systemUser) {
		logger.error("System user not found. Run `bun run db:seed` first.");
		process.exit(1);
	}

	// Overdue otomatis tiap jam 00:00 WITA
	// Callback-based Bun.cron pakai UTC, jadi 16:00 UTC = 00:00 WITA (+1 day)
	Bun.cron("0 16 * * *", async () => {
		await runOverdueCheck(systemUser);
		await runOverdueReminder(systemUser);
	});

	// Pembuatan invoice bulanan dan pengingat pembayaran tiap jam 8 pagi WITA
	// 00:00 UTC = 08:00 WITA
	Bun.cron("0 0 * * *", async () =>
		Promise.all([
			runInvoiceGeneration(systemUser),
			runPaymentReminder(systemUser),
		]),
	);

	// Laporan keuangan bulanan tiap tanggal 1 jam 8 pagi WITA
	// 00:00 UTC = 08:00 WITA
	Bun.cron("0 0 1 * *", () => runMonthlyReport(systemUser));

	logger.info("Cron jobs registered");
};

main();
