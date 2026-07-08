import { and, db, eq } from "@indekos/database";
import {
	auditDetail,
	auditLogs,
	pushHistory,
	pushSubscriptions,
} from "@indekos/database/schema";
import { sendPush } from "@indekos/utilities/push";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const subscribe = defineAction({
	accept: "json",
	input: z.object({
		endpoint: z.url(),
		keys: z.object({ auth: z.string(), p256dh: z.string() }),
	}),
	handler: async (input, context) => {
		const user = context.locals.user!;

		if (user.role === "admin") {
			throw new ActionError({
				code: "FORBIDDEN",
				message: "Notifikasi tidak tersedia untuk akun admin.",
			});
		}

		await db.insert(pushSubscriptions).values({
			userId: user.id,
			endpoint: input.endpoint,
			authKey: input.keys.auth,
			p256dhKey: input.keys.p256dh,
		});
		context.session?.set("pushEndpoint", input.endpoint);

		await db.insert(auditLogs).values({
			userId: user.id,
			action: "CREATE",
			tableName: "push_subscriptions",
			details: auditDetail.create("Mengaktifkan notifikasi", {
				endpoint: input.endpoint,
			}),
		});
	},
});

export const unsubscribe = defineAction({
	accept: "json",
	input: z.object({ endpoint: z.url() }),
	handler: async ({ endpoint }, context) => {
		await db
			.delete(pushSubscriptions)
			.where(eq(pushSubscriptions.endpoint, endpoint));
		context.session?.delete("pushEndpoint");

		await db.insert(auditLogs).values({
			userId: context.locals.user!.id,
			action: "DELETE",
			tableName: "push_subscriptions",
			details: auditDetail.delete("Menonaktifkan notifikasi", {
				endpoint,
			}),
		});
	},
});

export const deleteHistory = defineAction({
	accept: "json",
	input: z.object({ id: z.coerce.number() }),
	handler: async ({ id }, context) => {
		const endpoint = await context.session?.get("pushEndpoint");
		if (!endpoint)
			throw new ActionError({
				code: "FORBIDDEN",
				message: "Pendaftaran notifikasi tidak dikenal.",
			});

		await db
			.delete(pushHistory)
			.where(and(eq(pushHistory.endpoint, endpoint), eq(pushHistory.id, id)));
	},
});

export const test = defineAction({
	accept: "json",
	handler: async (_, context) => {
		const user = context.locals.user!;
		const endpoint = await context.session?.get("pushEndpoint");

		await sendPush([endpoint!], {
			title: "Test Notifikasi",
			body: "Notifikasi berhasil dikirim! 🎉",
		});

		await db.insert(auditLogs).values({
			userId: user.id,
			action: "CREATE",
			tableName: "push_history",
			details: auditDetail.notification("Menguji notifikasi", "push", user.id),
		});
	},
});
