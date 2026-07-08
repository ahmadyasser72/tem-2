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

	// Overdue invoice (status already marked overdue)
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 300_000,
		dueDate: new Date("2026-03-10"),
		status: "overdue",
	});

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
	it("creates notifications for overdue invoices only", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		const notifs = await db.query.notifications.findMany();
		expect(notifs.length).toBe(1);
		expect(notifs[0].type).toBe("overdue_reminder");
		expect(notifs[0].status).toBe("pending");
		expect(notifs[0].invoiceId).toBeDefined();
	});

	it("deduplicates within 24 hours", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// 12 hours later, still within 24 hour window
		const later = new Date("2026-07-09T04:00:00Z");
		await runOverdueReminder(systemUser, later);

		const notifs = await db.query.notifications.findMany();
		expect(notifs.length).toBe(1);
	});

	it("creates new reminder after 24 hours", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		// 25 hours later, outside 24 hour window
		const next = new Date("2026-07-09T17:00:00Z");
		await runOverdueReminder(systemUser, next);

		const notifs = await db.query.notifications.findMany();
		expect(notifs.length).toBe(2);
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
			columns: { invoiceId: true },
		});
		const invoiceIds = new Set(notifs.map((n) => n.invoiceId));
		expect(invoiceIds.size).toBe(2);
	});

	it("creates audit log entry", async () => {
		const now = new Date("2026-07-08T16:00:00Z");
		await runOverdueReminder(systemUser, now);

		const logs = await db.query.auditLogs.findMany({
			where: { tableName: "notifications" },
		});
		expect(logs.length).toBeGreaterThanOrEqual(1);
	});
});
