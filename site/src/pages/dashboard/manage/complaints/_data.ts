import { COMPLAINT_STATUS, db } from "@e-kos/database";

import { z } from "astro/zod";
import { countBy } from "es-toolkit";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export const complaintQuerySchema = z.object({
	query: querySchema,
	status: statusSchema(COMPLAINT_STATUS),
	...periodFields,
});

export type ComplaintRow = {
	id: number;
	description: string;
	status: string;
	createdAt: Date;
	tenantName: string;
	roomNumber: string | null;
	resolvedByUserName: string | null;
	resolveNotes: string | null;
	resolvedAt: Date | null;
};

export const fetchComplaints = async (
	params: z.infer<typeof complaintQuerySchema>,
	extra?: { usePeriod?: boolean },
): Promise<ComplaintRow[]> => {
	const where: Record<string, unknown> = {};

	if (params.query) {
		where.OR = [
			{ description: { like: `%${params.query}%` } },
			{ tenant: { fullName: { like: `%${params.query}%` } } },
		];
	}
	if (params.status) {
		where.status = params.status;
	}
	if (extra?.usePeriod && (params.from || params.to)) {
		const { startDate, endDate } = parseDateRange(
			params.from,
			params.to,
			"day",
		);
		const createdAtFilter: Record<string, Date> = {};
		if (startDate) createdAtFilter.gte = startDate;
		if (endDate) createdAtFilter.lte = endDate;
		where.createdAt = createdAtFilter;
	}

	const complaints = await db.query.complaints.findMany({
		where,
		with: {
			tenant: {
				with: {
					leases: {
						where: { isActive: true },
						with: { room: true },
					},
				},
			},
			resolver: true,
		},
	});

	return complaints.map((complaint) => {
		const [activeLease] = complaint.tenant?.leases ?? [];
		return {
			id: complaint.id,
			description: complaint.description,
			status: complaint.status,
			createdAt: complaint.createdAt,
			tenantName: complaint.tenant?.fullName ?? "-",
			roomNumber: activeLease?.room?.roomNumber ?? null,
			resolvedByUserName: complaint.resolver?.displayName ?? null,
			resolveNotes: complaint.resolveNotes,
			resolvedAt: complaint.resolvedAt,
		};
	});
};

export const getComplaintStats = (complaints: ComplaintRow[]) => {
	const counts = countBy(complaints, (complaint) => complaint.status);
	return [
		{ label: "Total Komplain", value: complaints.length },
		{ label: "Terbuka", value: counts.open ?? 0 },
		{ label: "Proses", value: counts.in_progress ?? 0 },
		{ label: "Selesai", value: counts.resolved ?? 0 },
	];
};

export const COMPLAINT_STATUS_BADGES: Record<
	(typeof COMPLAINT_STATUS)[number],
	string
> = {
	open: "badge-error",
	in_progress: "badge-warning",
	resolved: "badge-success",
};

export const COMPLAINT_STATUS_LABELS: Record<
	(typeof COMPLAINT_STATUS)[number],
	string
> = {
	open: "Terbuka",
	in_progress: "Proses",
	resolved: "Selesai",
};

export const COMPLAINT_STATUS_BORDERS: Record<
	(typeof COMPLAINT_STATUS)[number],
	string
> = {
	open: "border-error/40",
	in_progress: "border-warning/40",
	resolved: "border-success/40",
};
