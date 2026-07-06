import { db } from "@indekos/database";
import { complaints } from "@indekos/database/schema";
import { formatDate } from "@indekos/utilities/date";
import { sendPush } from "@indekos/utilities/push";

import { render } from "../../template";
import type { FlowDef } from "../types";

export const komplainFlow: FlowDef = {
	name: "komplain",
	initialStep: "prompt",
	steps: {
		prompt: async () => ({
			reply: render("complaint-prompt", {}),
			next: "collect",
		}),

		collect: async (input, session) => {
			const lower = input.trim().toLowerCase();

			if (lower === "batal") {
				return {
					reply: "❌ Komplain dibatalkan.",
					next: null,
				};
			}

			if (input.trim().length < 5) {
				return {
					reply:
						"✏️ Deskripsi terlalu pendek (min 5 karakter). Coba lagi atau ketik *batal* untuk membatalkan.",
				};
			}

			const [newComplaint] = await db
				.insert(complaints)
				.values({
					tenantId: session.tenant.id,
					description: input.trim(),
					status: "open",
				})
				.returning({ id: complaints.id, createdAt: complaints.createdAt });

			const users = await db.query.users.findMany({
				where: { role: { in: ["staff", "owner"] } },
			});

			await sendPush(users, {
				title: `Komplain Baru dari ${session.tenant.fullName}`,
				body: input.trim(),
				url: `/dashboard/complaints/${newComplaint.id}`,
			});

			return {
				reply: render("submit-complaint", {
					id: newComplaint.id,
					description: input.trim(),
					createdAt: formatDate(newComplaint.createdAt),
				}),
				next: null,
			};
		},
	},
};
