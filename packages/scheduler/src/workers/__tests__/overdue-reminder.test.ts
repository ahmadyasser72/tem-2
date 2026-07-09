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

import { runOverdueReminder } from "../overdue-reminder";

let systemUser: User;
let leaseId: number;
let invoiceId: number;
let tenantId: number;

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
			roomNumber: "OVR01",
			roomType: "standard",
			monthlyPrice: 300_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Overdue Reminder Test",
			phoneNumber: "6281234567899",
		})
		.returning({ id: tenants.id });

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

	leaseId = lease.id;
	tenantId = tenant.id;

	// Overdue invoice (status already marked overdue)
	const [invoice] = await db
		.insert(invoices)
		.values({
			leaseId: lease.id,
			amount: 300_000,
			dueDate: new Date("2026-03-10"),
			status: "overdue",
		})
		.returning({ id: invoices.id });

	invoiceId = invoice.id;

	// Paid invoice — should not create notification
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 300_000,
		dueDate: new Date("2026-02-10"),
		paidAt: new Date("2026-02-09"),
		status: "paid",
	});
});

afterAll(() => {
	db.run("ROLLBACK");
});

beforeEach(async () => {
	// Clear notifications before each test to avoid state pollution
	await db
		.delete(notifications)
		.where(eq(notifications.type, "overdue_reminder"));
});

describe("runOverdueReminder", () => {
	it("rule 1: no existing reminder -> queue one pending", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		const notif = await db.query.notifications.findFirst({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		expect(notif).not.toBeUndefined();
		expect(notif!.status).toBe("pending");
	});

	it("rule 2: recent pending reminder (<23h) -> do not queue", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runOverdueReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		expect(notifs).toHaveLength(1);
	});

	it("rule 6: pending reminder older than 23h -> queue new", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// 24 hours later, outside 23 hour window
		const next = new Date("2026-07-10T17:00:00Z");
		await runOverdueReminder(systemUser, next);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		expect(notifs).toHaveLength(2);
		expect(notifs.every((n) => n.status === "pending")).toBe(true);
	});

	it("creates notifications for multiple overdue invoices", async () => {
		// Insert a second overdue invoice
		await db.insert(invoices).values({
			leaseId,
			amount: 300_000,
			dueDate: new Date("2026-04-10"),
			status: "overdue",
		});

		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder" },
			columns: { invoiceId: true },
		});
		const invoiceIds = new Set(notifs.map((n) => n.invoiceId));
		expect(invoiceIds.size).toBe(2);
	});

	it("creates audit log entry", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		const logs = await db.query.auditLogs.findMany({
			where: { tableName: "notifications", userId: systemUser.id },
		});
		expect(logs.length).toBeGreaterThanOrEqual(1);
	});

	it("rule 3: recent sent reminder (<23h) -> do not queue", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// Mark first reminder as sent
		await db
			.update(notifications)
			.set({ status: "sent" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runOverdueReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		expect(notifs).toHaveLength(1);
	});

	it("rule 5: sent reminder older than 23h -> queue new", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// Mark first reminder as sent
		await db
			.update(notifications)
			.set({ status: "sent" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 24 hours later, outside 23 hour window
		const next = new Date("2026-07-10T16:00:00Z");
		await runOverdueReminder(systemUser, next);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		expect(notifs).toHaveLength(2);
		expect(notifs[1].status).toBe("pending");
	});

	it("rule 4: recent failed reminder (<23h) -> queue new pending", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// Mark first reminder as failed
		await db
			.update(notifications)
			.set({ status: "failed" })
			.where(eq(notifications.invoiceId, invoiceId));

		// 12 hours later, still within 23 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runOverdueReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany({
			where: { tenantId, type: "overdue_reminder", invoiceId },
		});
		// Should queue new one since failed reminders don't block
		expect(notifs).toHaveLength(2);
		expect(notifs[1].status).toBe("pending");
	});
});
