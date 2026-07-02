import dayjs from "@indekos/utilities/date";
import { hashPassword } from "@indekos/utilities/password";

import { db } from "./index";
import {
	auditLogs,
	chatbotMessages,
	complaints,
	invoices,
	leases,
	notifications,
	rooms,
	tenants,
	users,
} from "./schema";

// ─── Helpers ────────────────────────────────────────────────────

const PHONE = "62887435034436";
const hash = (p: string) => hashPassword(p);

/**
 * Relative date shorthand.
 *
 * `monthOffset` = months from start of current month (negative = past).
 * `day` = day-of-month (1-31).
 * `hour` / `min` = time (default 08:00).
 */
const d = (monthOffset: number, day: number, hour = 8, min = 0): Date =>
	dayjs()
		.add(monthOffset, "month")
		.startOf("month")
		.date(day)
		.hour(hour)
		.minute(min)
		.second(0)
		.toDate();

// ─── Main ───────────────────────────────────────────────────────

const main = async () => {
	// ── Reset all seeded tables (fresh start) ──────────────────
	console.log("Resetting tables...");
	// FK dependency order (reverse)
	await db.delete(chatbotMessages);
	await db.delete(notifications);
	await db.delete(invoices);
	await db.delete(complaints);
	await db.delete(auditLogs);
	await db.delete(leases);
	await db.delete(tenants);
	await db.delete(rooms);
	await db.delete(users);
	// Reset SQLite auto-increment counters
	await db.run(
		"DELETE FROM sqlite_sequence WHERE name IN ('chatbot_messages','notifications','invoices','complaints','audit_logs','leases','tenants','rooms','users')",
	);
	console.log("   Tables reset.");

	// ── 1. Users ───────────────────────────────────────────────
	console.log("1/9 Users...");

	const ensureUser = async (
		username: string,
		displayName: string,
		role: "admin" | "staff" | "owner" | "system",
		password?: string,
	) => {
		const [u] = await db
			.insert(users)
			.values({
				username,
				displayName,
				role,
				passwordHash: await hash(password ?? username),
			})
			.returning({ id: users.id });
		return u.id;
	};

	const systemId = await ensureUser("system", "System Scheduler", "system");
	// const botId = await ensureUser("bot-wa", "WhatsApp Bot", "system");
	const adminId = await ensureUser(
		"admin",
		"Administrator",
		"admin",
		process.env.ADMIN_PASSWORD ?? "admin123",
	);
	const staffId = await ensureUser(
		"staff",
		"Staff Operator",
		"staff",
		"staff123",
	);
	const ownerId = await ensureUser("owner", "Pemilik Kos", "owner", "owner123");

	console.log(
		"   system=%d admin=%d staff=%d owner=%d",
		systemId,
		adminId,
		staffId,
		ownerId,
	);

	// ── 2. Rooms ───────────────────────────────────────────────
	console.log("2/9 Rooms...");

	const roomData = [
		{
			roomNumber: "A-01",
			roomType: "standard" as const,
			monthlyPrice: 500_000,
			isActive: true,
		},
		{
			roomNumber: "A-02",
			roomType: "standard" as const,
			monthlyPrice: 500_000,
			isActive: true,
		},
		{
			roomNumber: "A-03",
			roomType: "standard" as const,
			monthlyPrice: 550_000,
			isActive: true,
		},
		{
			roomNumber: "B-01",
			roomType: "standard" as const,
			monthlyPrice: 600_000,
			isActive: true,
		},
		{
			roomNumber: "B-02",
			roomType: "standard" as const,
			monthlyPrice: 600_000,
			isActive: true,
		},
		{
			roomNumber: "B-03",
			roomType: "standard" as const,
			monthlyPrice: 650_000,
			isActive: true,
		},
		{
			roomNumber: "C-01",
			roomType: "premium" as const,
			monthlyPrice: 1_000_000,
			isActive: true,
		},
		{
			roomNumber: "C-02",
			roomType: "premium" as const,
			monthlyPrice: 1_000_000,
			isActive: true,
		},
		{
			roomNumber: "C-03",
			roomType: "premium" as const,
			monthlyPrice: 1_200_000,
			isActive: true,
		},
		{
			roomNumber: "D-01",
			roomType: "standard" as const,
			monthlyPrice: 750_000,
			isActive: true,
		},
		{
			roomNumber: "D-02",
			roomType: "standard" as const,
			monthlyPrice: 750_000,
			isActive: true,
		},
		{
			roomNumber: "E-01",
			roomType: "premium" as const,
			monthlyPrice: 1_500_000,
			isActive: true,
		},
		{
			roomNumber: "E-02",
			roomType: "premium" as const,
			monthlyPrice: 1_500_000,
			isActive: false,
		},
		{
			roomNumber: "F-01",
			roomType: "standard" as const,
			monthlyPrice: 800_000,
			isActive: true,
		},
		{
			roomNumber: "F-02",
			roomType: "standard" as const,
			monthlyPrice: 800_000,
			isActive: true,
		},
	];

	for (const r of roomData) await db.insert(rooms).values(r).run();

	const allRooms = await db.query.rooms.findMany({ orderBy: { id: "asc" } });
	const rid = (num: string) => allRooms.find((r) => r.roomNumber === num)!.id;
	console.log("   %d rooms inserted", allRooms.length);

	// // ── 3. Tenants ─────────────────────────────────────────────
	// console.log("3/9 Tenants...");

	// const tenantData = [
	// 	{ fullName: "Rina Wijaya", originRegion: "Surabaya", isVerified: true },
	// 	{ fullName: "Dimas Saputra", originRegion: "Malang", isVerified: true },
	// 	{ fullName: "Siti Nurhaliza", originRegion: "Bandung", isVerified: true },
	// 	{ fullName: "Agus Pratama", originRegion: "Yogyakarta", isVerified: true },
	// 	{ fullName: "Dewi Lestari", originRegion: "Semarang", isVerified: true },
	// 	{ fullName: "Bambang Susilo", originRegion: "Jakarta", isVerified: true },
	// 	{ fullName: "Maya Anggraini", originRegion: "Denpasar", isVerified: true },
	// 	{ fullName: "Fajar Hidayat", originRegion: "Makassar", isVerified: true },
	// 	{ fullName: "Intan Permata", originRegion: "Palembang", isVerified: false },
	// 	{ fullName: "Hendra Gunawan", originRegion: "Medan", isVerified: true },
	// 	{ fullName: "Putri Ayu", originRegion: "Pontianak", isVerified: true },
	// 	{ fullName: "Adi Nugroho", originRegion: "Solo", isVerified: true },
	// ];

	// for (const t of tenantData)
	// 	await db
	// 		.insert(tenants)
	// 		.values({ ...t, phoneNumber: PHONE })
	// 		.run();

	// const allTenants = await db.query.tenants.findMany({
	// 	orderBy: { id: "asc" },
	// });
	// const tid = (idx: number) => allTenants[idx].id;
	// console.log("   %d tenants inserted", allTenants.length);

	// // ── 4. Leases ──────────────────────────────────────────────
	// console.log("4/9 Leases...");

	// // Active leases
	// const activeLeaseData = [
	// 	{ ti: 0, r: "A-01", start: d(-19, 1), end: null },
	// 	{ ti: 1, r: "A-03", start: d(-17, 1), end: null },
	// 	{ ti: 2, r: "B-01", start: d(-17, 1), end: d(1, 1) },
	// 	{ ti: 3, r: "B-03", start: d(-16, 1), end: null },
	// 	{ ti: 4, r: "C-01", start: d(-17, 1), end: d(7, 1) },
	// 	{ ti: 5, r: "C-02", start: d(-15, 1), end: null },
	// 	{ ti: 6, r: "C-03", start: d(-14, 1), end: null },
	// 	{ ti: 7, r: "F-01", start: d(-12, 1), end: null },
	// 	{ ti: 8, r: "D-02", start: d(-11, 15), end: null },
	// ];

	// for (const l of activeLeaseData)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: tid(l.ti),
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: true,
	// 		})
	// 		.run();

	// // Completed leases
	// const completedLeaseData = [
	// 	{ ti: 9, r: "D-01", start: d(-29, 1), end: d(-24, 30) },
	// 	{ ti: 10, r: "B-02", start: d(-27, 1), end: d(-16, 28) },
	// 	{ ti: 11, r: "E-01", start: d(-24, 1), end: d(-18, 31) },
	// ];

	// for (const l of completedLeaseData)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: tid(l.ti),
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: false,
	// 		})
	// 		.run();

	// console.log(
	// 	"   %d leases inserted",
	// 	activeLeaseData.length + completedLeaseData.length,
	// );

	// // ── 5. Multi-lease Tenants (edge-case: pindah kamar & sewa ulang) ───
	// console.log("5/9 Multi-lease tenants (pindah kamar, sewa ulang)...");

	// // 3 tenants baru, masing-masing punya 2 lease (completed + active)
	// const multiTenantData = [
	// 	{ fullName: "Ahmad Fauzi", originRegion: "Bogor", isVerified: true },
	// 	{ fullName: "Dian Purnama", originRegion: "Lampung", isVerified: true },
	// 	{ fullName: "Bayu Segara", originRegion: "Bali", isVerified: true },
	// ];

	// const newTenantIds: number[] = [];
	// for (const t of multiTenantData) {
	// 	const [ins] = await db
	// 		.insert(tenants)
	// 		.values({ ...t, phoneNumber: PHONE })
	// 		.returning({ id: tenants.id });
	// 	newTenantIds.push(ins.id);
	// }

	// // Completed leases (riwayat lama)
	// const multiCompleted = [
	// 	// Ahmad: A-02 dulu, pindah ke D-01
	// 	{
	// 		ti: newTenantIds[0],
	// 		r: "A-02",
	// 		start: d(-18, 1),
	// 		end: d(-12, 31),
	// 	},
	// 	// Dian: E-01 dulu, sewa ulang E-01 lagi
	// 	{
	// 		ti: newTenantIds[1],
	// 		r: "E-01",
	// 		start: d(-16, 1),
	// 		end: d(-10, 31),
	// 	},
	// 	// Bayu: F-02 dulu, pindah ke B-02
	// 	{
	// 		ti: newTenantIds[2],
	// 		r: "F-02",
	// 		start: d(-14, 1),
	// 		end: d(-8, 30),
	// 	},
	// ];

	// for (const l of multiCompleted)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: l.ti,
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: false,
	// 		})
	// 		.run();

	// // Active leases (kamar sekarang)
	// const multiActive = [
	// 	{ ti: newTenantIds[0], r: "D-01", start: d(-11, 1), end: null },
	// 	{ ti: newTenantIds[1], r: "E-01", start: d(-9, 1), end: null },
	// 	{ ti: newTenantIds[2], r: "B-02", start: d(-7, 1), end: null },
	// ];

	// for (const l of multiActive)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: l.ti,
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: true,
	// 		})
	// 		.run();

	// console.log(
	// 	"   Added 3 tenants (15 total): Ahmad (pindah A-02→D-01), Dian (sewa ulang E-01), Bayu (sewa baru F-02→B-02)",
	// );

	// // ── 6. More Multi-lease Tenants (3+ leases, sewa ulang kamar) ───
	// console.log(
	// 	"6/9 More multi-lease tenants (Rizky 3 leases, Citra sewa ulang)...",
	// );

	// const moreTenantData = [
	// 	{ fullName: "Rizky Amalia", originRegion: "Bogor", isVerified: true },
	// 	{ fullName: "Citra Kirana", originRegion: "Aceh", isVerified: true },
	// ];

	// const moreTenantIds: number[] = [];
	// for (const t of moreTenantData) {
	// 	const [ins] = await db
	// 		.insert(tenants)
	// 		.values({ ...t, phoneNumber: PHONE })
	// 		.returning({ id: tenants.id });
	// 	moreTenantIds.push(ins.id);
	// }

	// // Completed leases (riwayat lama)
	// const moreCompleted = [
	// 	// Rizky: A-02 dulu, pindah ke F-02, lalu balik ke A-02
	// 	{ ti: moreTenantIds[0], r: "A-02", start: d(-30, 1), end: d(-24, 31) },
	// 	{ ti: moreTenantIds[0], r: "F-02", start: d(-22, 1), end: d(-16, 31) },
	// 	// Citra: F-02 dulu, sewa ulang F-02 lagi setelah gap
	// 	{ ti: moreTenantIds[1], r: "F-02", start: d(-14, 1), end: d(-8, 30) },
	// ];

	// for (const l of moreCompleted)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: l.ti,
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: false,
	// 		})
	// 		.run();

	// // Active leases (kamar sekarang)
	// const moreActive = [
	// 	{ ti: moreTenantIds[0], r: "A-02", start: d(-14, 1), end: null },
	// 	{ ti: moreTenantIds[1], r: "F-02", start: d(-6, 1), end: null },
	// ];

	// for (const l of moreActive)
	// 	await db
	// 		.insert(leases)
	// 		.values({
	// 			tenantId: l.ti,
	// 			roomId: rid(l.r),
	// 			startDate: l.start,
	// 			endDate: l.end,
	// 			isActive: true,
	// 		})
	// 		.run();

	// console.log(
	// 	"   Added 2 more tenants (17 total): Rizky (A-02→F-02→A-02, 3 leases), Citra (F-02 sewa ulang)",
	// );

	// // ── 7. Complaints ──────────────────────────────────────────
	// console.log("7/9 Complaints...");

	// // Fetch active leases for references
	// const activeLeases = await db.query.leases.findMany({
	// 	where: { isActive: true },
	// 	orderBy: { id: "asc" },
	// });
	// const leaseIdByRoom = (roomNum: string) =>
	// 	activeLeases.find((l) => l.roomId === rid(roomNum))!.id;

	// const complaintData = [
	// 	{
	// 		tenantId: tid(0), // Rina → A-01
	// 		description: "AC kamar tidak dingin, suhu tidak stabil sudah 2 hari",
	// 		status: "open" as const,
	// 	},
	// 	{
	// 		tenantId: tid(1), // Dimas → A-03
	// 		description: "Kunci pintu macet, sulit dibuka dari dalam",
	// 		status: "in_progress" as const,
	// 	},
	// 	{
	// 		tenantId: tid(3), // Agus → B-03
	// 		description: "Wi-Fi sering putus, sudah 3 hari",
	// 		status: "resolved" as const,
	// 		resolvedBy: adminId,
	// 		resolveNotes: "Router sudah diganti. Wi-Fi stabil kembali.",
	// 		resolvedAt: d(-1, 15),
	// 	},
	// 	{
	// 		tenantId: tid(4), // Dewi → C-01
	// 		description:
	// 			"Lampu kamar mati total, sudah ganti bohlam tetap tidak nyala",
	// 		status: "open" as const,
	// 	},
	// ];

	// for (const c of complaintData) await db.insert(complaints).values(c).run();
	// console.log("   %d complaints inserted", complaintData.length);

	// // ── 8. Invoices ────────────────────────────────────────────
	// console.log("8/9 Invoices...");

	// const invoiceData = [
	// 	// Paid invoices (pembayaran lampau)
	// 	{
	// 		leaseId: leaseIdByRoom("A-01"), // Rina
	// 		amount: 500_000,
	// 		dueDate: d(-1, 1),
	// 		paidAt: d(-1, 5),
	// 		status: "paid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("B-03"), // Agus
	// 		amount: 650_000,
	// 		dueDate: d(-1, 1),
	// 		paidAt: d(-1, 3),
	// 		status: "paid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("C-03"), // Maya
	// 		amount: 1_200_000,
	// 		dueDate: d(-2, 1),
	// 		paidAt: d(-2, 4),
	// 		status: "paid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("B-02"), // Bayu
	// 		amount: 600_000,
	// 		dueDate: d(-1, 1),
	// 		paidAt: d(-1, 8),
	// 		status: "paid" as const,
	// 	},
	// 	// Unpaid invoices (tagihan bulan depan)
	// 	{
	// 		leaseId: leaseIdByRoom("A-03"), // Dimas
	// 		amount: 550_000,
	// 		dueDate: d(1, 1),
	// 		status: "unpaid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("C-01"), // Dewi
	// 		amount: 1_000_000,
	// 		dueDate: d(1, 1),
	// 		status: "unpaid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("D-02"), // Intan
	// 		amount: 750_000,
	// 		dueDate: d(1, 1),
	// 		status: "unpaid" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("A-02"), // Rizky
	// 		amount: 500_000,
	// 		dueDate: d(1, 1),
	// 		status: "unpaid" as const,
	// 	},
	// 	// Overdue invoices (tagihan lewat tempo)
	// 	{
	// 		leaseId: leaseIdByRoom("B-01"), // Siti
	// 		amount: 600_000,
	// 		dueDate: d(-1, 1),
	// 		status: "overdue" as const,
	// 	},
	// 	{
	// 		leaseId: leaseIdByRoom("C-02"), // Bambang
	// 		amount: 1_000_000,
	// 		dueDate: d(-1, 1),
	// 		status: "overdue" as const,
	// 	},
	// ];

	// for (const inv of invoiceData) await db.insert(invoices).values(inv).run();
	// console.log("   %d invoices inserted", invoiceData.length);

	// // ── 9. Chatbot Messages ────────────────────────────────────
	// console.log("9/9 Chatbot messages, notifications, audit logs...");

	// const chatbotData = [
	// 	{
	// 		tenantId: tid(0), // Rina
	// 		direction: "incoming" as const,
	// 		message: "Pak, AC kamar saya tidak dingin sudah 2 hari",
	// 		sentAt: d(0, 20, 14, 30),
	// 	},
	// 	{
	// 		tenantId: tid(0), // Rina
	// 		direction: "outgoing" as const,
	// 		message:
	// 			"Terima kasih laporannya, Bu Rina. Kami akan segera cek AC di kamar A-01.",
	// 		sentAt: d(0, 20, 14, 35),
	// 	},
	// 	{
	// 		tenantId: tid(2), // Siti
	// 		direction: "incoming" as const,
	// 		message: "Tagihan bulan ini kapan jatuh tempo?",
	// 		sentAt: d(0, 18, 9, 0),
	// 	},
	// 	{
	// 		tenantId: tid(2), // Siti
	// 		direction: "outgoing" as const,
	// 		message:
	// 			"Tagihan bulan ini jatuh tempo tanggal 1 Juli 2026. Silakan bayar sebelum jatuh tempo ya, Bu!",
	// 		sentAt: d(0, 18, 9, 2),
	// 	},
	// 	{
	// 		tenantId: tid(7), // Fajar
	// 		direction: "incoming" as const,
	// 		message: "Bisa bayar lewat QRIS?",
	// 		sentAt: d(0, 19, 10, 15),
	// 	},
	// 	{
	// 		tenantId: tid(7), // Fajar
	// 		direction: "outgoing" as const,
	// 		message:
	// 			"Bisa! Link pembayaran QRIS akan dikirim segera. Silakan tunggu.",
	// 		sentAt: d(0, 19, 10, 17),
	// 	},
	// ];

	// for (const msg of chatbotData)
	// 	await db.insert(chatbotMessages).values(msg).run();
	// console.log("   %d chatbot messages inserted", chatbotData.length);

	// // ── 10. Notifications ──────────────────────────────────────
	// const notificationData = [
	// 	{
	// 		tenantId: tid(0), // Rina
	// 		type: "welcome" as const,
	// 		status: "sent" as const,
	// 	},
	// 	{
	// 		tenantId: tid(2), // Siti
	// 		type: "reminder" as const,
	// 		status: "pending" as const,
	// 	},
	// 	{
	// 		tenantId: tid(3), // Agus
	// 		type: "custom" as const,
	// 		status: "sent" as const,
	// 	},
	// 	{
	// 		tenantId: tid(4), // Dewi
	// 		type: "reminder" as const,
	// 		status: "pending" as const,
	// 	},
	// 	{
	// 		tenantId: tid(8), // Intan (belum verifikasi)
	// 		type: "welcome" as const,
	// 		status: "pending" as const,
	// 	},
	// ];

	// for (const n of notificationData)
	// 	await db.insert(notifications).values(n).run();
	// console.log("   %d notifications inserted", notificationData.length);

	// // ── 11. Audit Logs ─────────────────────────────────────────
	// const auditData = [
	// 	{
	// 		userId: adminId,
	// 		action: "LOGIN" as const,
	// 		tableName: "users",
	// 		recordId: adminId,
	// 		details: {
	// 			type: "generic" as const,
	// 			description: "User admin berhasil login",
	// 		},
	// 	},
	// 	{
	// 		userId: systemId,
	// 		action: "CREATE" as const,
	// 		tableName: "invoices",
	// 		recordId: null,
	// 		details: {
	// 			type: "cron" as const,
	// 			description: "Cron created 10 invoice(s)",
	// 			table: "invoices" as const,
	// 			ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
	// 		},
	// 	},
	// 	{
	// 		userId: systemId,
	// 		action: "UPDATE" as const,
	// 		tableName: "invoices",
	// 		recordId: null,
	// 		details: {
	// 			type: "cron" as const,
	// 			description: "Cron marked 2 invoice(s) as overdue",
	// 			table: "invoices" as const,
	// 			ids: [9, 10],
	// 		},
	// 	},
	// 	{
	// 		userId: staffId,
	// 		action: "CREATE" as const,
	// 		tableName: "complaints",
	// 		recordId: 1,
	// 		details: {
	// 			type: "create" as const,
	// 			description: "Komplain dari Rina Wijaya: AC kamar tidak dingin",
	// 		},
	// 	},
	// ];

	// for (const log of auditData) await db.insert(auditLogs).values(log).run();
	// console.log("   %d audit logs inserted", auditData.length);

	console.log("\n✅ Blackbox seed complete!");
	console.log("   17 tenants, 23 leases, 4 complaints, 10 invoices,");
	console.log("   6 chatbot messages, 5 notifications, 4 audit logs.");
	console.log(
		"   Next: login to dashboard and test all features (see BLACKBOX.md).",
	);
};

main();
