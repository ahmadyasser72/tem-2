import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@e-kos/database";
import { invoices, leases, rooms, tenants } from "@e-kos/database/schema";

import { paymentHistory } from "../payment-history";

let testTenant: typeof tenants.$inferSelect;

beforeAll(async () => {
	db.run("BEGIN");

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: "TST03",
			roomType: "standard",
			monthlyPrice: 250_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "History Test",
			phoneNumber: "6281234567893",
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

	// Past paid invoices
	await db.insert(invoices).values([
		{
			leaseId: lease.id,
			amount: 250_000,
			dueDate: new Date("2026-01-10"),
			paidAt: new Date("2026-01-12"),
			status: "paid",
		},
		{
			leaseId: lease.id,
			amount: 250_000,
			dueDate: new Date("2026-02-10"),
			paidAt: new Date("2026-02-11"),
			status: "paid",
		},
	]);

	testTenant = (await db.query.tenants.findFirst({
		where: { id: tenant.id },
	}))!;
});

afterAll(() => {
	db.run("ROLLBACK");
});

describe("paymentHistory", () => {
	it("returns paid invoices list", async () => {
		const result = await paymentHistory(testTenant);
		expect(result).toContain("250");
		expect(result).toContain("2");
	});

	it("does not say no history when invoices exist", async () => {
		const result = await paymentHistory(testTenant);
		expect(result).not.toContain("tidak memiliki riwayat");
	});
});
