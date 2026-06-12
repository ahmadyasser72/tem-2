// ─── Overdue otomatis tiap jam 00:00 ──────────────
Bun.cron("./src/workers/overdue.ts", "0 0 * * *", "overdue-check");

// ─── Pengingat pembayaran tiap jam 8 pagi ─────────
Bun.cron("./src/workers/rent-reminder.ts", "0 8 * * *", "rent-reminder");

console.log("[Scheduler] Cron jobs registered");
