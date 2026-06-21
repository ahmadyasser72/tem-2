import { db, eq } from "@e-kos/database";
import {
	auditDetail,
	auditLogs,
	chatbotMessages,
} from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const remove = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const user = await context.session?.get("user");
		const userId = user?.id ?? null;

		const value = await db.query.chatbotMessages.findFirst({ where: { id } });
		if (!value) {
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Pesan chatbot tidak ditemukan.",
			});
		}

		await db.delete(chatbotMessages).where(eq(chatbotMessages.id, id));

		await db.insert(auditLogs).values({
			userId,
			action: "DELETE",
			tableName: "chatbot_messages",
			recordId: id,
			details: auditDetail.delete(
				`Menghapus log pesan chatbot dengan ID: ${id}`,
				value,
			),
		});

		return { success: true, id };
	},
});
