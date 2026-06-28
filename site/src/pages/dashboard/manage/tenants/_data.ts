import { db } from "@e-kos/database";

import { z } from "astro/zod";

import { querySchema, statusSchema } from "~/lib/query";

export const TENANT_STATUS = ["active", "completed"] as const;

export const fetchTenants = async (
	params: z.infer<typeof tenantsQuerySchema>,
) => {
	const tenants = await db.query.tenants.findMany({
		where: {
			...(params.query && {
				OR: [
					{ fullName: { like: `%${params.query}%` } },
					{ phoneNumber: { like: `%${params.query}%` } },
					{ lease: { room: { roomNumber: { like: `%${params.query}%` } } } },
				],
			}),

			...(params.status &&
				((params.status === "active" && { lease: { isActive: true } }) ||
					(params.status === "completed" && {
						NOT: { lease: { isActive: true } },
					}))),
		},
		with: { lease: { with: { room: true } } },
	});

	return tenants.map(({ lease, ...tenant }) => ({
		...tenant,
		roomNumber: lease?.room.roomNumber ?? "-",
		startDate: lease?.startDate ?? null,
		endDate: lease?.endDate ?? null,
		isActive: !!lease,
	}));
};

export const tenantsQuerySchema = z.object({
	query: querySchema,
	status: statusSchema(TENANT_STATUS),
});

// Keys are derived display values (not from DB schema)
// because tenant status is computed from isActive boolean
export const TENANT_STATUS_BADGES: Record<string, string> = {
	Aktif: "badge-success",
	Selesai: "badge-neutral opacity-60",
	Pindah: "badge-neutral",
};
