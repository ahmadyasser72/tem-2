import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { db } from "@indekos/database";
import { leases, rooms, tenants } from "@indekos/database/schema";

import { contactStaffFlow } from "~/conversation/flows/contact-staff";
import type {
	ActiveTenant,
	ConversationSession,
	MessageInput,
} from "~/conversation/types";

let testTenant: ActiveTenant;

beforeEach(async () => {
	db.run("BEGIN");

	const [room] = await db
		.insert(rooms)
		.values({
			roomNumber: `CS${Math.random().toString().slice(2, 6)}`,
			roomType: "standard",
			monthlyPrice: 200_000,
			isActive: true,
		})
		.returning({ id: rooms.id });

	const [tenant] = await db
		.insert(tenants)
		.values({
			fullName: "Contact Staff Test",
			phoneNumber: `628${Math.random().toString().slice(2, 11)}`,
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
		with: { lease: { columns: {}, with: { room: true } } },
	}))! as ActiveTenant;
});

afterEach(() => {
	db.run("ROLLBACK");
});

const makeSession = (
	overrides?: Partial<ConversationSession>,
): ConversationSession => ({
	jid: "test-jid",
	tenant: testTenant,
	flow: "contact_staff",
	step: "prompt",
	lastActivity: Date.now(),
	data: {},
	...overrides,
});

const text = (t: string): MessageInput => ({ text: t });

describe("contactStaffFlow", () => {
	describe("prompt step", () => {
		it('cancels on "batal"', async () => {
			const session = makeSession();
			const result = await contactStaffFlow.steps.prompt(
				text("batal"),
				session,
			);

			expect(result.reply).toBe("❌ Permintaan menghubungi staf dibatalkan.");
			expect(result.next).toBeNull();
		});

		it('cancels on "cs batal" (strips prefix)', async () => {
			const session = makeSession();
			const result = await contactStaffFlow.steps.prompt(
				text("cs batal"),
				session,
			);

			expect(result.reply).toBe("❌ Permintaan menghubungi staf dibatalkan.");
			expect(result.next).toBeNull();
		});

		it("creates chat request when text provided", async () => {
			const session = makeSession();
			const result = await contactStaffFlow.steps.prompt(
				text("Ada masalah dengan AC"),
				session,
			);

			expect(result.reply).toContain("Pesan Anda telah diteruskan");
			expect(result.next).toBeNull();

			const request = await db.query.chatRequests.findFirst({
				where: { tenantId: session.tenant.id },
			});
			expect(request).toBeDefined();
			expect(request?.description).toBe("Ada masalah dengan AC");
			expect(request?.status).toBe("pending");
		});

		it("strips 'cs ' prefix from text", async () => {
			const session = makeSession();
			await contactStaffFlow.steps.prompt(
				text("cs Ada masalah dengan AC"),
				session,
			);

			const request = await db.query.chatRequests.findFirst({
				where: { tenantId: session.tenant.id },
			});
			expect(request?.description).toBe("Ada masalah dengan AC");
		});

		it("transitions to collect step when no text", async () => {
			const session = makeSession();
			const result = await contactStaffFlow.steps.prompt(text(""), session);

			expect(result.reply).toContain("Silakan ketik alasan");
			expect(result.next).toBe("collect");
		});

		it("rejects message shorter than 5 characters", async () => {
			const session = makeSession();
			const result = await contactStaffFlow.steps.prompt(text("abc"), session);

			expect(result.reply).toContain("min 5 karakter");
			expect(result.next).toBeUndefined();
		});
	});

	describe("collect step", () => {
		it('cancels on "batal"', async () => {
			const session = makeSession({ step: "collect" });
			const result = await contactStaffFlow.steps.collect(
				text("batal"),
				session,
			);

			expect(result.reply).toBe("❌ Permintaan menghubungi staf dibatalkan.");
			expect(result.next).toBeNull();
		});

		it("creates chat request with valid text", async () => {
			const session = makeSession({ step: "collect" });
			const result = await contactStaffFlow.steps.collect(
				text("Kamar tidak bisa dikunci"),
				session,
			);

			expect(result.reply).toContain("Pesan Anda telah diteruskan");
			expect(result.next).toBeNull();

			const request = await db.query.chatRequests.findFirst({
				where: { tenantId: session.tenant.id },
			});
			expect(request).toBeDefined();
			expect(request?.description).toBe("Kamar tidak bisa dikunci");
			expect(request?.status).toBe("pending");
		});

		it("rejects message shorter than 5 characters", async () => {
			const session = makeSession({ step: "collect" });
			const result = await contactStaffFlow.steps.collect(text("hi"), session);

			expect(result.reply).toContain("min 5 karakter");
			expect(result.next).toBeUndefined();
		});
	});
});
