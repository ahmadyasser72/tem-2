import { db } from "@e-kos/database";

import { logger } from ".";
import { runInvoiceGeneration } from "./workers/invoice-generation";
import { runOverdueCheck } from "./workers/overdue";
import { runRentReminder } from "./workers/rent-reminder";

const main = async () => {
	const task = process.argv[2];
	const dateStr = process.argv[3];

	if (!task || !dateStr) {
		logger.error("Usage: bun trigger <task> <date>");
		logger.error("Run a scheduler task with a specific reference date.");
		logger.error("  task   overdue | reminder | invoice");
		logger.error("  date   YYYY-MM-DD (WITA, UTC+8)");
		process.exit(1);
	}

	const date = new Date(`${dateStr}T00:00:00+08:00`);

	if (Number.isNaN(date.getTime())) {
		logger.error({ dateStr }, "Invalid date");
		process.exit(1);
	}

	const systemUser = await db.query.users.findFirst({
		where: { username: "system" },
	});

	if (!systemUser) {
		logger.error("System user not found. Run `bun run db:seed` first.");
		process.exit(1);
	}

	switch (task) {
		case "overdue":
			await runOverdueCheck(systemUser, date);
			break;
		case "reminder":
			await runRentReminder(systemUser, date);
			break;
		case "invoice":
			await runInvoiceGeneration(systemUser, date);
			break;
		default:
			logger.error(
				{ task },
				"Unknown task. Available: overdue, reminder, invoice",
			);
			process.exit(1);
	}
};

main();
