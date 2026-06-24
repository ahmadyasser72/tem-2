import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@e-kos/database";
import { invoices, leases, rooms, tenants } from "@e-kos/database/schema";

import { checkBills } from "../check-bills";

let testTenant: typeof tenants.$inferSelect;

beforeAll(async () => {
	db.run("BEGIN");

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: "TST02",
			roomType: "premium",
			monthlyPrice: 500_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Bills Test",
			phoneNumber: "6281234567891",
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

	// Unpaid invoice
	await db.insert(invoices).values({
		leaseId: lease.id,
		amount: 500_000,
		dueDate: new Date("2026-06-10"),
		status: "unpaid",
	});

	testTenant = (await db.query.tenants.findFirst({
		where: { id: tenant.id },
	}))!;
});

afterAll(() => {
	db.run("ROLLBACK");
});

describe("checkBills", () => {
	it("reports unpaid bills", async () => {
		const result = await checkBills(testTenant);
		expect(result).toContain("500");
		expect(result).toContain("TST02");
		expect(result).toContain("1 tagihan");
	});

	it("does not say all paid when unpaid exist", async () => {
		const result = await checkBills(testTenant);
		expect(result).not.toContain("Semua pembayaran lunas");
	});
});
