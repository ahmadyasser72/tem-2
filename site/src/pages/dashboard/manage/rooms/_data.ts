import { db } from "@e-kos/database";
import { ROOM_TYPES } from "@e-kos/database/schema";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import { querySchema } from "~/lib/query";

export const ROOM_STATUS = ["occupied", "vacant", "inactive"] as const;

export { ROOM_TYPES };

export type RoomRow = {
	id: number;
	roomNumber: string;
	roomType: (typeof ROOM_TYPES)[number];
	monthlyPrice: number;
	isActive: boolean;
	tenantName: string | null;
};

const mapRoomFromDb = (room: {
	id: number;
	roomNumber: string;
	roomType: (typeof ROOM_TYPES)[number];
	monthlyPrice: number;
	isActive: boolean;
	lease: {
		isActive: boolean;
		tenant: { fullName: string };
	} | null;
}): RoomRow => {
	return {
		id: room.id,
		roomNumber: room.roomNumber,
		roomType: room.roomType,
		monthlyPrice: room.monthlyPrice,
		isActive: room.isActive,
		tenantName: room.lease?.tenant?.fullName ?? null,
	};
};

export const fetchAllRooms = async (): Promise<RoomRow[]> => {
	const rooms = await db.query.rooms.findMany({
		with: {
			lease: {
				with: { tenant: true },
			},
		},
	});
	return rooms.map(mapRoomFromDb);
};

export const fetchFilteredRooms = async (
	params: z.infer<typeof roomQuerySchema>,
): Promise<RoomRow[]> => {
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
			lease: {
				with: { tenant: true },
			},
		},
	});

	return rooms.map(mapRoomFromDb);
};

export const getAllRoomsStats = async (rooms: RoomRow[]) => {
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
			value: rooms.length.toString(),
			icon: "lucide:house",
		},
		{
			title: "Kamar Terisi",
			value: occupied.toString(),
			icon: "lucide:circle-check",
		},
		{
			title: "Kamar Tersedia",
			value: vacant.toString(),
			icon: "lucide:circle-alert",
		},
		{
			title: "Kamar Nonaktif",
			value: inactive.toString(),
			icon: "lucide:x-circle",
		},
	];
};

export const roomQuerySchema = z.object({
	query: querySchema,
	status: z.enum(ROOM_STATUS).optional().catch(undefined),
	type: z.enum(ROOM_TYPES).optional().catch(undefined),
});

export const reportRoomQuerySchema = z.object({
	status: z.enum(ROOM_STATUS).optional().catch(undefined),
	type: z.enum(ROOM_TYPES).optional().catch(undefined),
});

export const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
	standard: "Standar",
	premium: "Premium",
};

export const ROOM_STATUS_LABELS: Record<(typeof ROOM_STATUS)[number], string> =
	{
		occupied: "Terisi",
		vacant: "Kosong",
		inactive: "Nonaktif",
	};

export const ROOM_STATUS_BADGES: Record<string, string> = {
	occupied: "badge-success",
	vacant: "badge-warning",
	inactive: "badge-neutral",
};
