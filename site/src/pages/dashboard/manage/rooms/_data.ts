import { db } from "@indekos/database";
import { ROOM_TYPES } from "@indekos/database/schema";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import { querySchema, statusSchema } from "~/lib/query";

export const ROOM_STATUS = ["occupied", "vacant", "inactive"] as const;

export { ROOM_TYPES };

export const fetchRooms = async (params: z.infer<typeof roomQuerySchema>) => {
	const rooms = await db.query.rooms.findMany({
		where: {
			...(params.query && {
				OR: [
					{ roomNumber: { like: `%${params.query}%` } },
					{ roomType: { like: `%${params.query}%` } },
					{
						lease: { tenant: { fullName: { like: `%${params.query}%` } } },
					},
				],
			}),

			...(params.status &&
				((params.status === "occupied" && {
					isActive: true,
					lease: { isActive: true },
				}) ||
					(params.status === "vacant" && {
						isActive: true,
						NOT: { lease: { isActive: true } },
					}) ||
					(params.status === "inactive" && { isActive: false }))),

			...(params.type && { roomType: params.type }),
		},
		with: {
			lease: { with: { tenant: true } },
		},
	});

	return rooms.map(({ lease, ...room }) => ({
		...room,
		tenantName: lease?.tenant?.fullName ?? null,
	}));
};

export const getRoomsStats = (
	rooms: Awaited<ReturnType<typeof fetchRooms>>,
) => {
	const occupied = sumBy(rooms, ({ isActive, tenantName }) =>
		isActive && tenantName ? 1 : 0,
	);
	const vacant = sumBy(rooms, ({ isActive, tenantName }) =>
		isActive && !tenantName ? 1 : 0,
	);
	const inactive = sumBy(rooms, ({ isActive }) => (!isActive ? 1 : 0));
	return [
		{
			title: "Total Kamar",
			value: rooms.length,
			icon: "lucide:house" as const,
		},
		{
			title: "Kamar Terisi",
			value: occupied,
			icon: "lucide:circle-check" as const,
		},
		{
			title: "Kamar Tersedia",
			value: vacant,
			icon: "lucide:circle-alert" as const,
		},
		{
			title: "Kamar Nonaktif",
			value: inactive,
			icon: "lucide:x-circle" as const,
		},
	];
};

export const roomQuerySchema = z.object({
	query: querySchema,
	status: statusSchema(ROOM_STATUS),
	type: statusSchema(ROOM_TYPES),
});

export const ROOM_TYPE_LABELS = {
	standard: "Standar",
	premium: "Premium",
} satisfies Record<(typeof ROOM_TYPES)[number], string>;

export const ROOM_STATUS_LABELS = {
	occupied: "Terisi",
	vacant: "Kosong",
	inactive: "Nonaktif",
} satisfies Record<(typeof ROOM_STATUS)[number], string>;

export const ROOM_STATUS_BADGES = {
	occupied: "badge-success",
	vacant: "badge-warning",
	inactive: "badge-neutral",
} satisfies Record<(typeof ROOM_STATUS)[number], string>;
