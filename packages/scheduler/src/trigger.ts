import { db } from "@e-kos/database";

import { runOverdueCheck } from "./workers/overdue";
import { runRentReminder } from "./workers/rent-reminder";

async function main() {
	const task = process.argv[2];
	const dateStr = process.argv[3];

	if (!task || !dateStr) {
		console.error("Usage: bun trigger <task> <date>");
		console.error();
		console.error("Run a scheduler task with a specific reference date.");
		console.error();
		console.error("  task   overdue | reminder");
		console.error("  date   YYYY-MM-DD (WITA, UTC+8)");
		process.exit(1);
	}

	const date = new Date(`${dateStr}T00:00:00+08:00`);

	if (Number.isNaN(date.getTime())) {
		console.error(`Invalid date: ${dateStr}`);
		process.exit(1);
	}

	const systemUser = await db.query.users.findFirst({
		where: { username: "system" },
	});

	if (!systemUser) {
		console.error(
			"[Scheduler] System user not found. Run `bun run db:seed` first.",
		);
		process.exit(1);
	}

	switch (task) {
		case "overdue":
			await runOverdueCheck(systemUser, date);
			break;
		case "reminder":
			await runRentReminder(systemUser, date);
			break;
		default:
			console.error(`Unknown task: ${task}`);
			console.error("Available tasks: overdue, reminder");
			process.exit(1);
	}
}

main();
