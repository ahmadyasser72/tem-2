import { db } from "@e-kos/database";
import { chatbotMessages, notifications, auditLogs } from "@e-kos/database/schema";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const send = defineAction({
	accept: "form",
	input: z.object({
		tenant_id: z.coerce.number(),
		message: z.string().min(1, "Pesan tidak boleh kosong"),
	}),
	handler: async (input, context) => {
		const tenantExists = await db.query.tenants.findFirst({
			columns: { id: true },
			where: { id: input.tenant_id },
		});
		if (!tenantExists) {
			throw new ActionError({
				code: "NOT_FOUND",
				message: "Penghuni tidak ditemukan.",
			});
		}

		// Insert chatbot message first
		const [msg] = await db
			.insert(chatbotMessages)
			.values({
				tenantId: input.tenant_id,
				direction: "outgoing",
				message: input.message,
				sentAt: new Date(),
			})
			.returning({ id: chatbotMessages.id });

		// Insert notification linked to the chatbot message
		const [inserted] = await db
			.insert(notifications)
			.values({
				tenantId: input.tenant_id,
				chatbotMessageId: msg.id,
				type: "custom",
				status: "sent",
			})
			.returning({ id: notifications.id });

		const user = await context.session?.get("user");
		await db.insert(auditLogs).values({
			userId: user?.id ?? null,
			action: "CREATE",
			tableName: "notifications",
			recordId: inserted.id,
			details: `Mengirim notifikasi khusus ke tenant ID ${input.tenant_id}: ${input.message}`,
		});

		return inserted;
	},
});
