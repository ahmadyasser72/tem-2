import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@e-kos/database";
import { leases, rooms, tenants } from "@e-kos/database/schema";

import { tenantInfo } from "../tenant-info";

let testTenant: typeof tenants.$inferSelect;

beforeAll(async () => {
	db.run("BEGIN");

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: "TST01",
			roomType: "standard",
			monthlyPrice: 200_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Test User",
			phoneNumber: "6281234567890",
			originRegion: "Test City",
		})
		.returning({ id: tenants.id });

	await db.insert(leases).values({
		tenantId: tenant.id,
		roomId: room.id,
		startDate: new Date("2026-01-01"),
		endDate: null,
		isActive: true,
	});

	testTenant = (await db.query.tenants.findFirst({
		where: { id: tenant.id },
	}))!;
});

afterAll(() => {
	db.run("ROLLBACK");
});

describe("tenantInfo", () => {
	it("returns tenant name and room details", async () => {
		const result = await tenantInfo(testTenant);
		expect(result).toContain("Test User");
		expect(result).toContain("TST01");
		expect(result).toContain("Rp 200");
		expect(result).toContain("standard");
		expect(result).toContain("Rp");
	});

	it("includes start date", async () => {
		const result = await tenantInfo(testTenant);
		expect(result).toContain("1/1/2026");
	});

	it("shows active lease message for null endDate", async () => {
		const result = await tenantInfo(testTenant);
		expect(result).toContain("Berlangsung");
	});
});
