import { db } from "@e-kos/database";

import { z } from "astro/zod";

import { querySchema } from "~/lib/query";

export const TENANT_STATUS = ["active", "completed"] as const;

export type TenantRow = {
	id: number;
	fullName: string;
	phoneNumber: string;
	originRegion: string | null;
	createdAt: Date;
	roomNumber: string;
	startDate: Date | null;
	endDate: Date | null;
	isActive: boolean;
};

function mapTenantFromDb(tenant: {
	id: number;
	fullName: string;
	phoneNumber: string;
	originRegion: string | null;
	createdAt: Date;
	leases: Array<
		{
			isActive: boolean;
			room: { roomNumber: string } | null;
		} & Record<string, unknown>
	>;
}): TenantRow {
	const currentLease =
		tenant.leases.find((l) => l.isActive) ?? tenant.leases[0];
	return {
		id: tenant.id,
		fullName: tenant.fullName,
		phoneNumber: tenant.phoneNumber,
		originRegion: tenant.originRegion,
		createdAt: tenant.createdAt,
		roomNumber: currentLease?.room?.roomNumber ?? "-",
		startDate: (currentLease?.startDate as Date) ?? null,
		endDate: (currentLease?.endDate as Date) ?? null,
		isActive: !!currentLease?.isActive,
	};
}

export async function fetchTenants(
	params: z.infer<typeof tenantsQuerySchema>,
): Promise<TenantRow[]> {
	const where: Record<string, unknown> = {};

	if (params.query) {
		where.OR = [
			{ fullName: { like: `%${params.query}%` } },
			{ phoneNumber: { like: `%${params.query}%` } },
		];
	}
	if (params.status && params.status !== "all") {
		if (params.status === "active") where.leases = { isActive: true };
		if (params.status === "completed")
			where.NOT = { leases: { isActive: true } };
	}

	const tenants = await db.query.tenants.findMany({
		where,
		with: {
			leases: { with: { room: true } },
		},
	});

	return tenants.map(mapTenantFromDb);
}

export async function fetchAllTenants(): Promise<TenantRow[]> {
	const tenants = await db.query.tenants.findMany({
		with: {
			leases: { with: { room: true } },
		},
	});
	return tenants.map(mapTenantFromDb);
}

export const tenantsQuerySchema = z.object({
	query: querySchema,
	status: z
		.enum(["all", ...TENANT_STATUS])
		.optional()
		.catch(undefined),
});

export const reportTenantsQuerySchema = z.object({
	status: z
		.enum(["all", ...TENANT_STATUS])
		.optional()
		.catch(undefined),
});

export const TENANT_STATUS_LABELS: Record<
	(typeof TENANT_STATUS)[number],
	string
> = {
	active: "Aktif",
	completed: "Selesai",
};

// Keys are derived display values (not from DB schema)
// because tenant status is computed from isActive boolean
export const TENANT_STATUS_BADGES: Record<string, string> = {
	Aktif: "badge-success",
	Selesai: "badge-neutral opacity-60",
	Pindah: "badge-neutral",
};
