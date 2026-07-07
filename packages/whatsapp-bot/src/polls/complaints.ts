import { db, eq } from "@indekos/database";
import { auditDetail, auditLogs, complaints } from "@indekos/database/schema";

import type { WASocket } from "baileys";

import { render } from "~/template";

export const pollInProgressComplaints = async (
	sock: WASocket,
	botUserId: number,
) => {
	const inProgress = await db.query.complaints.findMany({
		where: { status: "in_progress", processedAt: { isNull: true } },
		with: { tenant: true },
	});

	for (const complaint of inProgress) {
		try {
			const msg = render("complaint-in-progress", {
				fullName: complaint.tenant.fullName,
				id: complaint.id,
				description: complaint.description,
			});

			await sock.sendMessage(`${complaint.tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			await db
				.update(complaints)
				.set({ processedAt: new Date() })
				.where(eq(complaints.id, complaint.id));

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "CREATE",
				tableName: "notifications",
				details: auditDetail.notification(
					`Bot memberitahu tenant #${complaint.tenant.id} bahwa komplain #${complaint.id} sedang diproses`,
					"whatsapp",
					complaint.tenant.id,
				),
			});

			console.log(
				`Complaint #${complaint.id} in-progress notified to ${complaint.tenant.phoneNumber}`,
			);
		} catch (err) {
			console.error(
				`Complaint #${complaint.id} in-progress notification failed:`,
				err,
			);
		}
	}
};

export const pollResolvedComplaints = async (
	sock: WASocket,
	botUserId: number,
) => {
	const resolved = await db.query.complaints.findMany({
		where: { status: "resolved", resolvedAt: { isNull: true } },
		with: { tenant: true, resolver: true },
	});

	for (const complaint of resolved) {
		try {
			const msg = render("complaint-resolved", {
				fullName: complaint.tenant.fullName,
				id: complaint.id,
				description: complaint.description,
				resolveNotes: complaint.resolveNotes ?? null,
				resolverDisplayName: complaint.resolver?.displayName ?? "Staf",
			});

			await sock.sendMessage(`${complaint.tenant.phoneNumber}@s.whatsapp.net`, {
				text: msg,
			});

			await db
				.update(complaints)
				.set({ resolvedAt: new Date() })
				.where(eq(complaints.id, complaint.id));

			await db.insert(auditLogs).values({
				userId: botUserId,
				action: "CREATE",
				tableName: "notifications",
				details: auditDetail.notification(
					`Bot memberitahu tenant #${complaint.tenant.id} bahwa komplain #${complaint.id} selesai diproses`,
					"whatsapp",
					complaint.tenant.id,
				),
			});

			console.log(
				`Complaint #${complaint.id} resolved notified to ${complaint.tenant.phoneNumber}`,
			);
		} catch (err) {
			console.error(
				`Complaint #${complaint.id} resolved notification failed:`,
				err,
			);
		}
	}
};
