import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { db, eq } from "@indekos/database";
import {
	invoices,
	leases,
	notifications,
	rooms,
	tenants,
	users,
	type User,
} from "@indekos/database/schema";

import { runPaymentReminder } from "../payment-reminder";

let systemUser: User;
let tenantId: number;
let invoiceId: number;

beforeAll(async () => {
	db.run("BEGIN");

	systemUser =
		(await db.query.users.findFirst({ where: { username: "system" } })) ??
		(
			await db
				.insert(users)
				.values({
					username: "system",
					passwordHash: "x",
					displayName: "System",
					role: "system",
				})
				.returning()
		)[0];

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: "REM01",
			roomType: "standard",
			monthlyPrice: 250_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Reminder Test",
			phoneNumber: "6281234567897",
		})
		.returning({ id: tenants.id });

	tenantId = tenant.id;

	const [lease] = await db
		.insert(leases)
		.values({
			tenantId: tenant.id,
			roomId: room.id,
			startDate: new Date("2026-01-01"),
			endDate: null,
			isActive: true,
		})
		.returning({ id: leases.id });

	// Invoice due within 3 days from ref date
	const [invoice] = await db
		.insert(invoices)
		.values({
			leaseId: lease.id,
			amount: 250_000,
			dueDate: new Date("2026-07-11"),
			status: "unpaid",
		})
		.returning({ id: invoices.id });

	invoiceId = invoice.id;
});

afterAll(() => {
	db.run("ROLLBACK");
});

beforeEach(async () => {
	// Clear notifications before each test to avoid state pollution
	await db.delete(notifications).where(eq(notifications.type, "reminder"));
});

describe("runPaymentReminder", () => {
	it("rule 1: no existing reminder -> queue one pending", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		const notif = await db.query.notifications.findFirst({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(notif).not.toBeUndefined();
		expect(notif!.status).toBe("pending");
	});

	it("rule 2: recent pending reminder (<23h) -> do not queue", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runPaymentReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(notifs).toHaveLength(1);
	});

	it("rule 6: pending reminder older than 23h -> queue new", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		// 24 hours later, outside 23 hour window
		const next = new Date("2026-07-10T16:00:00Z");
		await runPaymentReminder(systemUser, next);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(notifs).toHaveLength(2);
		expect(notifs.every((n) => n.status === "pending")).toBe(true);
	});

	it("does not create notification for invoice outside 3-day window", async () => {
		const tooEarly = new Date("2026-07-01T00:00:00Z");
		await runPaymentReminder(systemUser, tooEarly);

		const after = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(after).toHaveLength(0);
	});

	it("creates audit log for reminders", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		const audit = await db.query.auditLogs.findFirst({
			where: {
				action: "CREATE",
				tableName: "notifications",
				userId: systemUser.id,
			},
		});
		expect(audit).not.toBeUndefined();
		expect(audit!.details).toMatchObject({
			type: "cron",
			table: "notifications",
		});
	});

	it("rule 3: recent sent reminder (<23h) -> do not queue", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		// Mark first reminder as sent
		await db
			.update(notifications)
			.set({ status: "sent" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runPaymentReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(notifs).toHaveLength(1);
	});

	it("rule 5: sent reminder older than 23h -> queue new", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		// Mark first reminder as sent
		await db
			.update(notifications)
			.set({ status: "sent" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 24 hours later, outside 23 hour window
		const next = new Date("2026-07-10T16:00:00Z");
		await runPaymentReminder(systemUser, next);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		expect(notifs).toHaveLength(2);
		expect(notifs[1].status).toBe("pending");
	});

	it("rule 4: recent failed reminder (<23h) -> queue new pending", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runPaymentReminder(systemUser, now);

		// Mark first reminder as failed
		await db
			.update(notifications)
			.set({ status: "failed" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runPaymentReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "reminder", invoiceId },
		});
		// Should queue new one since failed reminders don't block
		expect(notifs).toHaveLength(2);
		expect(notifs[1].status).toBe("pending");
	});
});
