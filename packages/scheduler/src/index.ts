import { db } from "@e-kos/database";
import { createLogger, pino } from "@e-kos/utilities/logger";

import { runInvoiceGeneration } from "./workers/invoice-generation";
import { runOverdueCheck } from "./workers/overdue";
import { runRentReminder } from "./workers/rent-reminder";

export const logger: pino.Logger = createLogger("scheduler");

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
	Bun.cron("0 16 * * *", () => runOverdueCheck(systemUser));

	// Pembuatan invoice bulanan dan pengingat pembayaran tiap jam 8 pagi WITA
	// 00:00 UTC = 08:00 WITA
	Bun.cron("0 0 * * *", async () =>
		Promise.all([
			runInvoiceGeneration(systemUser),
			runRentReminder(systemUser),
		]),
	);

	logger.info("Cron jobs registered");
};

main();
