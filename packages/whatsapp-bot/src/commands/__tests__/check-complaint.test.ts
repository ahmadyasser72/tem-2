import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@e-kos/database";
import { complaints, tenants } from "@e-kos/database/schema";

import { checkComplaint } from "../check-complaint";

let testTenant: typeof tenants.$inferSelect;
let complaintId: number;

beforeAll(async () => {
	db.run("BEGIN");

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Complaint Test",
			phoneNumber: "6281234567892",
		})
		.returning({ id: tenants.id });

	const [complaint] = await db
		.insert(complaints)
		.values({
			tenantId: tenant.id,
			description: "AC kamar tidak dingin",
			status: "open",
		})
		.returning({ id: complaints.id });

	testTenant = (await db.query.tenants.findFirst({
		where: { id: tenant.id },
	}))!;
	complaintId = complaint.id;
});

afterAll(() => {
	db.run("ROLLBACK");
});

describe("checkComplaint", () => {
	it("returns complaint details for valid id", async () => {
		const result = await checkComplaint(testTenant, complaintId);
		expect(result).toContain(`#${complaintId}`);
		expect(result).toContain("AC kamar tidak dingin");
		expect(result).toContain("Menunggu ditangani");
	});

	it("returns not found for invalid id", async () => {
		const result = await checkComplaint(testTenant, 99999);
		expect(result).toBe("Komplain dengan ID tersebut tidak ditemukan.");
	});

	it("shows resolver info when resolved", async () => {
		const resolved = await db
			.insert(complaints)
			.values({
				tenantId: testTenant.id,
				description: "Kran bocor",
				status: "resolved",
				resolveNotes: "Sudah diperbaiki",
			})
			.returning({ id: complaints.id });

		const result = await checkComplaint(testTenant, resolved[0].id);
		expect(result).toContain("Selesai");
		expect(result).toContain("Sudah diperbaiki");
	});
});
