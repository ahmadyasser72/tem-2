import { db, eq } from "@e-kos/database";
import { rooms, auditLogs } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const add = defineAction({
	accept: "form",
	input: z.object({
		room_number: z.string(),
		room_type: z.string(),
		monthly_price: z.coerce.number(),
		is_active: z.stringbool().optional().default(false),
	}),
	handler: async (input, context) => {
		const exists = await db.query.rooms.findFirst({
			columns: { id: true },
			where: { roomNumber: input.room_number },
		});
		if (exists?.id)
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor kamar sudah terdaftar.",
			});

		const [inserted] = await db
			.insert(rooms)
			.values({
				roomNumber: input.room_number,
				roomType: input.room_type,
				monthlyPrice: input.monthly_price,
				isActive: input.is_active,
			})
			.returning({ id: rooms.id });

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "CREATE",
			tableName: "rooms",
			recordId: inserted.id,
			details: `Menambah kamar ${input.room_number} (${input.room_type || "-"})`,
		});

		return inserted;
	},
});

export const edit = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		room_number: z.string(),
		room_type: z.string(),
		monthly_price: z.coerce.number(),
		is_active: z.stringbool().optional().default(false),
	}),
	handler: async (input, context) => {
		const sameNumber = await db.query.rooms.findFirst({
			columns: { id: true },
			where: { roomNumber: input.room_number, id: { ne: input.id } },
		});
		if (sameNumber?.id)
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Nomor kamar sudah terdaftar.",
			});

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

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "UPDATE",
			tableName: "rooms",
			recordId: updated.id,
			details: `Mengubah kamar ${input.room_number} (${input.room_type || "-"})`,
		});

		return updated;
	},
});
