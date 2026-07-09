import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { db } from "@indekos/database";
import {
	invoices,
	leases,
	rooms,
	tenants,
	users,
	type User,
} from "@indekos/database/schema";

import { runMonthlyReport } from "../monthly-report";

const sendPushMock = mock(() => Promise.resolve({ sent: 0 }));
mock.module("@indekos/utilities/push", () => ({
	sendPush: sendPushMock,
}));

let systemUser: User;

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

	const [_staff] = await db
		.insert(users)
		.values({
			username: "monthly-staff",
			passwordHash: "x",
			displayName: "Monthly Staff",
			role: "staff",
		})
		.returning();

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: "MRY01",
			roomType: "standard",
			monthlyPrice: 500_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Monthly Test",
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

	// Paid invoice in June (previous month relative to REF_DATE)
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 500_000,
		dueDate: new Date("2026-06-05"),
		status: "paid",
	});

	// Unpaid invoice in June
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 500_000,
		dueDate: new Date("2026-06-15"),
		status: "unpaid",
	});

	// Invoice in July (current month, should not be counted)
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 500_000,
		dueDate: new Date("2026-07-01"),
		status: "paid",
	});
});

afterAll(() => {
	db.run("ROLLBACK");
});

describe("runMonthlyReport", () => {
	beforeEach(() => {
		sendPushMock.mockClear();
	});

	it("inserts audit log with correct counts", async () => {
		const before = await db.query.auditLogs.findMany();

		await runMonthlyReport(systemUser, new Date("2026-07-05"));

		const after = await db.query.auditLogs.findMany();
		const newLog = after.find((log) => !before.some((b) => b.id === log.id));

		expect(newLog).toBeDefined();
		expect(newLog!.userId).toBe(systemUser.id);
		expect(newLog!.action).toBe("CREATE");
		expect(newLog!.tableName).toBe("push_history");

		const details = newLog!.details as {
			type: string;
			description: string;
			channel: string;
		};
		expect(details.type).toBe("notification");
		expect(details.channel).toBe("push");
		expect(details.description).toContain("1 terbayar");
		expect(details.description).toContain("1 tertunggak");
	});
});
