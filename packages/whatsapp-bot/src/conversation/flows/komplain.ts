import fs from "node:fs/promises";
import path from "node:path";
import { db, eq } from "@indekos/database";
import { complaints } from "@indekos/database/schema";
import { formatDate } from "@indekos/utilities/date";
import { sendPush } from "@indekos/utilities/push";

import { render } from "../../template";
import type { FlowDef, MessageInput } from "../types";

const getUploadsDir = () =>
	process.env.UPLOADS_DIR || path.resolve(process.cwd(), "../../site/uploads");

const saveImage = async (
	buffer: Buffer,
	mimetype: string,
	complaintId: number,
): Promise<string> => {
	const ext = mimetype.split("/")[1] ?? "jpg";
	const filename = `complaints/${complaintId}.${ext}`;
	const uploadsDir = getUploadsDir();
	const filePath = path.join(uploadsDir, filename);

	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, buffer);

	return filename;
};

export const komplainFlow: FlowDef = {
	name: "komplain",
	initialStep: "prompt",
	steps: {
		prompt: async () => ({
			reply: render("complaint-prompt", {}),
			next: "collect",
		}),

		collect: async (input: MessageInput, session) => {
			const text = input.text.trim();
			const lower = text.toLowerCase();

			if (lower === "batal") {
				return {
					reply: "❌ Komplain dibatalkan.",
					next: null,
				};
			}

			// Use caption or placeholder if image without text
			const description = input.image ? text || "Foto" : text;

			if (!input.image && description.length < 5) {
				return {
					reply:
						"✏️ Deskripsi terlalu pendek (min 5 karakter). Coba lagi atau ketik *batal* untuk membatalkan.",
				};
			}

			const [newComplaint] = await db
				.insert(complaints)
				.values({
					tenantId: session.tenant.id,
					description,
					status: "open",
				})
				.returning({ id: complaints.id, createdAt: complaints.createdAt });

			// Save image if present
			if (input.image) {
				const imagePath = await saveImage(
					input.image.buffer,
					input.image.mimetype,
					newComplaint.id,
				);

				await db
					.update(complaints)
					.set({ imagePath })
					.where(eq(complaints.id, newComplaint.id));
			}

			const users = await db.query.users.findMany({
				where: { role: "staff" },
			});

			// Notifikasi push — gagal notif jangan blokir balasan
			try {
				if (users.length > 0) {
					await sendPush(users, {
						title: `Komplain Baru dari ${session.tenant.fullName}`,
						body: input.image ? `${description} [dengan foto]` : description,
						url: `/dashboard/complaints/${newComplaint.id}`,
					});
				}
			} catch (err) {
				console.error(
					"push notification failed for complaint %s:",
					newComplaint.id,
					err,
				);
			}

			return {
				reply: render("submit-complaint", {
					id: newComplaint.id,
					description,
					createdAt: formatDate(newComplaint.createdAt),
				}),
				next: null,
			};
		},
	},
};
