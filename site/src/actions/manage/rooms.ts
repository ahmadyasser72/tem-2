import { db, eq, ROOM_TYPES } from "@e-kos/database";
import { auditDetail, rooms } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { toCamelCaseKeys } from "es-toolkit/object";

export const add = defineAction({
	accept: "form",
	input: z.object({
		room_number: z.string(),
		room_type: z.enum(ROOM_TYPES),
		monthly_price: z.coerce.number(),
		is_active: z.stringbool().optional().default(false),
	}),
	handler: async (input, context) => {
		const exists = await db.query.rooms.findFirst({
			columns: { id: true },
			where: { roomNumber: input.room_number },
		});
		if (exists?.id) {
			console.error("rooms.add: room number already exists", {
				room_number: input.room_number,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor kamar sudah terdaftar.",
			});
		}

		const [inserted] = await db
			.insert(rooms)
			.values({
				roomNumber: input.room_number,
				roomType: input.room_type,
				monthlyPrice: input.monthly_price,
				isActive: input.is_active,
			})
			.returning({ id: rooms.id });

		await context.locals.logAudit(
			"CREATE",
			"rooms",
			inserted.id,
			auditDetail.create(
				`Menambah kamar ${input.room_number} (${input.room_type})`,
				toCamelCaseKeys(input),
			),
		);

		return inserted;
	},
});

export const edit = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		room_number: z.string(),
		room_type: z.enum(ROOM_TYPES),
		monthly_price: z.coerce.number(),
		is_active: z.stringbool().optional().default(false),
	}),
	handler: async (input, context) => {
		const sameNumber = await db.query.rooms.findFirst({
			columns: { id: true },
			where: { roomNumber: input.room_number, id: { ne: input.id } },
		});
		if (sameNumber?.id) {
			console.error("rooms.edit: room number already exists", {
				room_number: input.room_number,
			});
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor kamar sudah terdaftar.",
			});
		}

		const oldRoom = await db.query.rooms.findFirst({
			columns: {
				id: true,
				roomNumber: true,
				roomType: true,
				monthlyPrice: true,
				isActive: true,
			},
			where: { id: input.id },
		});
		if (!oldRoom) {
			console.error("rooms.edit: room not found", { id: input.id });
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Kamar tidak ditemukan.",
			});
		}

		const [updated] = await db
			.update(rooms)
			.set({
				roomNumber: input.room_number,
				roomType: input.room_type,
				monthlyPrice: input.monthly_price,
				isActive: input.is_active,
			})
			.where(eq(rooms.id, input.id))
			.returning({ id: rooms.id });

		await context.locals.logAudit(
			"UPDATE",
			"rooms",
			updated.id,
			auditDetail.update(
				`Mengubah kamar ${input.room_number} (${input.room_type})`,
				oldRoom,
				toCamelCaseKeys(input),
			),
		);

		return updated;
	},
});

export const _delete = defineAction({
	accept: "form",
	input: z.object({ id: z.coerce.number() }),
	handler: async ({ id }, context) => {
		const target = await db.query.rooms.findFirst({
			columns: {
				id: true,
				roomNumber: true,
				roomType: true,
				monthlyPrice: true,
				isActive: true,
			},
			where: { id },
		});
		if (!target) {
			console.error("rooms.delete: room not found", { id });
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Kamar tidak ditemukan.",
			});
		}

		const [deleted] = await db
			.delete(rooms)
			.where(eq(rooms.id, id))
			.returning({ id: rooms.id });

		await context.locals.logAudit(
			"DELETE",
			"rooms",
			deleted.id,
			auditDetail.delete(
				`Menghapus kamar ${target.roomNumber} (${target.roomType})`,
				target,
			),
		);

		return deleted;
	},
});
