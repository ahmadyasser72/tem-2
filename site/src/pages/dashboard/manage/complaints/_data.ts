import { COMPLAINT_STATUS, db } from "@e-kos/database";

import { z } from "astro/zod";
import { countBy } from "es-toolkit";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";

export const fetchComplaints = async (
	params: z.infer<typeof complaintQuerySchema>,
) => {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

	const complaints = await db.query.complaints.findMany({
		where: {
			...(params.query && {
				OR: [
					{ description: { like: `%${params.query}%` } },
					{ tenant: { fullName: { like: `%${params.query}%` } } },
				],
			}),

			...(params.status && { status: params.status }),

			createdAt: { gte: startDate, lte: endDate },
		},
		with: {
			tenant: { with: { lease: { with: { room: true } } } },
			resolver: true,
		},
	});

	return complaints.map(({ tenant, resolver, ...complaint }) => ({
		...complaint,
		tenantName: tenant.fullName,
		roomNumber: tenant.lease?.room?.roomNumber ?? null,
		resolvedByUserName: resolver?.displayName ?? null,
	}));
};

export const getComplaintStats = (
	complaints: Awaited<ReturnType<typeof fetchComplaints>>,
) => {
	const counts = countBy(complaints, (complaint) => complaint.status);
	return [
		{ title: "Total Komplain", value: complaints.length },
		{ title: "Terbuka", value: counts.open ?? 0 },
		{ title: "Proses", value: counts.in_progress ?? 0 },
		{ title: "Selesai", value: counts.resolved ?? 0 },
	];
};

export const complaintQuerySchema = z.object({
	query: querySchema,
	status: statusSchema(COMPLAINT_STATUS),
	...periodFields,
});

export const COMPLAINT_STATUS_BADGES = {
	open: "badge-error",
	in_progress: "badge-warning",
	resolved: "badge-success",
} satisfies Record<(typeof COMPLAINT_STATUS)[number], string>;

export const COMPLAINT_STATUS_LABELS = {
	open: "Terbuka",
	in_progress: "Proses",
	resolved: "Selesai",
} satisfies Record<(typeof COMPLAINT_STATUS)[number], string>;

export const COMPLAINT_STATUS_BORDERS = {
	open: "border-error/40",
	in_progress: "border-warning/40",
	resolved: "border-success/40",
} satisfies Record<(typeof COMPLAINT_STATUS)[number], string>;
