import { db, eq } from "@e-kos/database";
import { chatbotMessages, auditLogs } from "@e-kos/database/schema";

import { defineAction } from "astro:actions";
import { z } from "astro/zod";

export const remove = defineAction({
	accept: "form",
	input: z.object({
		id: z.coerce.number(),
	}),
	handler: async ({ id }, context) => {
		const user = await context.session?.get("user");
		const userId = user?.id ?? null;

		await db.delete(chatbotMessages).where(eq(chatbotMessages.id, id));

		await db.insert(auditLogs).values({
			userId,
			action: "DELETE",
			tableName: "chatbot_messages",
			recordId: id,
			details: `Menghapus log pesan chatbot dengan ID: ${id}`,
		});

		return { success: true, id };
	},
});
