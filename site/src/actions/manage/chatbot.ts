import { db, eq } from "@e-kos/database";
import { auditDetail, chatbotMessages } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const remove = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const value = await db.query.chatbotMessages.findFirst({ where: { id } });
		if (!value) {
			console.error("chatbot.remove: message not found", { id });
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Pesan chatbot tidak ditemukan.",
			});
		}

		await db.delete(chatbotMessages).where(eq(chatbotMessages.id, id));

		await context.locals.logAudit(
			"DELETE",
			"chatbot_messages",
			id,
			auditDetail.delete(`Menghapus log pesan chatbot dengan ID: ${id}`, value),
		);

		return { success: true, id };
	},
});
