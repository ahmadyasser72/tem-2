import { db } from "@e-kos/database";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import { querySchema } from "~/lib/query";

export const ROOM_STATUS = ["occupied", "vacant", "inactive"] as const;
export const ROOM_TYPES = ["Standar", "Premium"] as const;

export type RoomRow = {
	id: number;
	roomNumber: string;
	roomType: string;
	monthlyPrice: number;
	isActive: boolean;
	tenantName: string | null;
};

function mapRoomFromDb(room: {
	id: number;
	roomNumber: string;
	roomType: string | null;
	monthlyPrice: number;
	isActive: boolean;
	leases: Array<{
		isActive: boolean;
		tenant: { fullName: string } | null;
	}>;
}): RoomRow {
	const activeLease = room.leases.find((l) => l.isActive);
	return {
		id: room.id,
		roomNumber: room.roomNumber,
		roomType: room.roomType ?? "Standar",
		monthlyPrice: room.monthlyPrice,
		isActive: room.isActive,
		tenantName: activeLease?.tenant?.fullName ?? null,
	};
}

export async function fetchAllRooms(): Promise<RoomRow[]> {
	const rooms = await db.query.rooms.findMany({
		with: {
			leases: {
				where: { isActive: true },
				with: { tenant: true },
			},
		},
	});
	return rooms.map(mapRoomFromDb);
}

export async function fetchFilteredRooms(
	params: z.infer<typeof roomQuerySchema>,
): Promise<RoomRow[]> {
	const dbWhere: Record<string, unknown> = {};

	if (params.query) {
		dbWhere.OR = [
			{ roomNumber: { like: `%${params.query}%` } },
			{ roomType: { like: `%${params.query}%` } },
			{
				leases: {
					isActive: true,
					tenant: {
						fullName: { like: `%${params.query}%` },
					},
				},
			},
		];
	}
	if (params.status) {
		if (params.status === "inactive") dbWhere.isActive = false;
		if (params.status === "occupied") {
			dbWhere.isActive = true;
			dbWhere.leases = { isActive: true };
		}
		if (params.status === "vacant") {
			dbWhere.isActive = true;
			dbWhere.NOT = { leases: { isActive: true } };
		}
	}
	if (params.type) {
		dbWhere.roomType = params.type;
	}

	const rooms = await db.query.rooms.findMany({
		where: dbWhere,
		with: {
			leases: {
				where: { isActive: true },
				with: { tenant: true },
			},
		},
	});
	return rooms.map(mapRoomFromDb);
}

export async function getAllRoomsStats(rooms: RoomRow[]) {
	const occupied = sumBy(rooms, (r) => (r.isActive && r.tenantName ? 1 : 0));
	const vacant = sumBy(rooms, (r) => (r.isActive && !r.tenantName ? 1 : 0));
	const inactive = sumBy(rooms, (r) => (!r.isActive ? 1 : 0));
	return [
		{
			title: "Total Kamar",
			value: rooms.length.toString(),
			icon: "line-md:home-md",
		},
		{
			title: "Kamar Terisi",
			value: occupied.toString(),
			icon: "line-md:circle-to-confirm-circle-transition",
		},
		{
			title: "Kamar Tersedia",
			value: vacant.toString(),
			icon: "line-md:alert-circle",
		},
		{
			title: "Kamar Nonaktif",
			value: inactive.toString(),
			icon: "line-md:close-circle",
		},
	];
}

export function getRoomStatus(room: RoomRow): string {
	if (!room.isActive) return "Nonaktif";
	if (room.tenantName) return "Terisi";
	return "Kosong";
}

export const roomQuerySchema = z.object({
	query: querySchema,
	status: z.enum(ROOM_STATUS).optional().catch(undefined),
	type: z.enum(ROOM_TYPES).optional().catch(undefined),
});

export const reportRoomQuerySchema = z.object({
	status: z.enum(ROOM_STATUS).optional().catch(undefined),
	type: z.enum(ROOM_TYPES).optional().catch(undefined),
});

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
