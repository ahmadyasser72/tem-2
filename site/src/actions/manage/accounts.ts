import { db, eq } from "@e-kos/database";
import { users, auditLogs } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

import { hashPassword, ROLES } from "~/lib/auth";

export const add = defineAction({
	accept: "form",
	input: z.object({
		username: z.string(),
		display_name: z.string(),
		password: z.string(),
		role: z.enum(ROLES),
	}),
	handler: async (input, context) => {
		const sameUsername = await db.query.users.findFirst({
			columns: { id: true },
			where: { username: input.username },
		});
		if (sameUsername?.id)
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Username tidak tersedia.",
			});

		const [inserted] = await db
			.insert(users)
			.values({
				username: input.username,
				displayName: input.display_name,
				passwordHash: hashPassword(input.password),
				role: input.role,
			})
			.returning({ id: users.id });

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "CREATE",
			tableName: "users",
			recordId: inserted.id,
			details: `Membuat akun user: ${input.username} dengan role: ${input.role}`,
		});

		return inserted;
	},
});

export const edit = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
		username: z.string(),
		display_name: z.string(),
		password: z.string().optional(),
		role: z.enum(ROLES),
	}),
	handler: async (input, context) => {
		const sameUsername = await db.query.users.findFirst({
			columns: { id: true },
			where: { username: input.username, id: { ne: input.id } },
		});
		if (sameUsername?.id)
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Username tidak tersedia.",
			});

		const [updated] = await db
			.update(users)
			.set({
				username: input.username,
				displayName: input.display_name,
				passwordHash: input.password ? hashPassword(input.password) : undefined,
				role: input.role,
			})
			.where(eq(users.id, input.id))
			.returning({ id: users.id });

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "UPDATE",
			tableName: "users",
			recordId: updated.id,
			details: `Mengubah akun user: ${input.username} dengan role: ${input.role}`,
		});

		return updated;
	},
});

export const _delete = defineAction({
	accept: "form",
	input: z.object({ id: z.coerce.number() }),
	handler: async (input, context) => {
		const exists = await db.query.users.findFirst({
			columns: { id: true },
			where: { id: input.id },
		});
		if (!exists?.id)
			throw new ActionError({
				code: "BAD_REQUEST",
				message: "Akun tidak ditemukan.",
			});

		const [deleted] = await db
			.delete(users)
			.where(eq(users.id, input.id))
			.returning({ id: users.id });

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "DELETE",
			tableName: "users",
			recordId: deleted.id,
			details: `Menghapus akun user dengan ID: ${deleted.id}`,
		});

		return deleted;
	},
});
