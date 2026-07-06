import { db, eq } from "@indekos/database";
import {
	auditDetail,
	auditLogs,
	chatbotMessages,
	tenants,
	type Tenant,
} from "@indekos/database/schema";
import { createLogger } from "@indekos/utilities/logger";

import { downloadMediaMessage, makeWASocket } from "baileys";

import { useSqliteAuthState } from "./auth";
import { checkBills } from "./commands/check-bills";
import { checkComplaint } from "./commands/check-complaint";
import { help } from "./commands/help";
import { listComplaints } from "./commands/list-complaints";
import { paymentHistory } from "./commands/payment-history";
import { submitComplaint } from "./commands/submit-complaint";
import { tenantInfo } from "./commands/tenant-info";
import { komplainFlow } from "./conversation/flows/komplain";
import { ConversationManager } from "./conversation/manager";
import type { MessageInput } from "./conversation/types";
import {
	pollInProgressComplaints,
	pollResolvedComplaints,
} from "./polls/complaints";
import { pollNotifications } from "./polls/notifications";
import { render } from "./template";

const unknownCooldowns = new Map<string, number>();

const conversationManager = new ConversationManager();
conversationManager.registerFlow(komplainFlow);

export const main = async () => {
	const botUser = await db.query.users.findFirst({
		where: { username: "bot-wa" },
	});

	if (!botUser) {
		console.error("User 'bot-wa' not found. Run `bun run db:seed` first.");
		process.exit(1);
	}

	const { state, saveCreds } = await useSqliteAuthState();

	if (!state.creds.me) {
		console.error("WhatsApp belum login.");
		process.exit(1);
	}

	const sock = makeWASocket({
		auth: state,
		logger: createLogger("whatsapp-bot"),
	});

	sock.ev.on("creds.update", saveCreds);

	sock.ev.on("connection.update", (update) => {
		const { lastDisconnect, connection } = update;
		if (connection === "close") {
			console.error("disconnect error:", lastDisconnect?.error);
		}
	});

	sock.ev.on("messages.upsert", async ({ messages }) => {
		for (const message of messages) {
			if (message.key.fromMe) continue;

			const jid = message.key.remoteJidAlt!;
			if (!jid?.endsWith("@s.whatsapp.net")) continue;

			const imageMsg = message.message?.imageMessage;
			const text = (
				message.message?.conversation ||
				imageMsg?.caption ||
				""
			).trim();

			if (!text && !imageMsg) continue;

			const lower = text.toLowerCase().trim();
			const phone = jid.replace("@s.whatsapp.net", "");
			const tenant = await db.query.tenants.findFirst({
				where: { phoneNumber: phone },
			});

			if (!tenant) {
				const cooldownUntil = unknownCooldowns.get(jid);
				if (cooldownUntil && Date.now() < cooldownUntil) {
					continue;
				}

				await sock.sendMessage(jid, {
					text: render("unknown-number", {}),
				});

				unknownCooldowns.set(jid, Date.now() + 30_000);

				await db.insert(auditLogs).values({
					userId: botUser.id,
					action: "REJECT",
					tableName: "chatbot_messages",
					details: auditDetail.reject(
						`Menolak pesan dari nomor tidak terdaftar: ${phone}`,
						"unregistered_number",
					),
				});

				continue;
			}

			await db.insert(chatbotMessages).values({
				tenantId: tenant.id,
				direction: "incoming",
				message: text || "📷 [gambar]",
			});

			// Tenant belum verifikasi — cek konfirmasi "YA"
			if (!tenant.isVerified) {
				if (lower === "ya") {
					await db
						.update(tenants)
						.set({ isVerified: true })
						.where(eq(tenants.id, tenant.id));

					await sock.sendMessage(
						jid,
						{
							text: render("verification-success", {
								fullName: tenant.fullName,
							}),
						},
						{ quoted: message },
					);
				} else {
					await sock.sendMessage(jid, {
						text: render("verification-prompt", { fullName: tenant.fullName }),
					});
				}
				continue;
			}

			// Build message input — download image if present
			const messageInput: MessageInput = { text };
			if (imageMsg) {
				try {
					const buffer = await downloadMediaMessage(message, "buffer", {});
					messageInput.image = { buffer, mimetype: imageMsg.mimetype! };
				} catch (err) {
					console.error("failed to download image for %s:", jid, err);
				}
			}

			// ── Tenant dikenal ──────────────────────────────────────
			// 1. Active conversation session — proses langsung
			if (conversationManager.hasActiveSession(jid)) {
				const reply = await conversationManager.handleMessage(
					jid,
					messageInput,
				);

				if (reply) {
					await db.insert(chatbotMessages).values({
						tenantId: tenant.id,
						direction: "outgoing",
						message: reply,
					});

					await sock.sendMessage(jid, { text: reply }, { quoted: message });
				}
				continue;
			}

			// 2. Pesan trigger flow interaktif — start session + proses
			if (lower === "komplain") {
				conversationManager.startSession(jid, tenant, "komplain");

				const reply = await conversationManager.handleMessage(
					jid,
					messageInput,
				);

				if (reply) {
					await db.insert(chatbotMessages).values({
						tenantId: tenant.id,
						direction: "outgoing",
						message: reply,
					});

					await sock.sendMessage(jid, { text: reply }, { quoted: message });
				}
				continue;
			}

			// 3. Fallback — proses langsung
			const responseText = await processCommand(tenant, text);

			await db.insert(chatbotMessages).values({
				tenantId: tenant.id,
				direction: "outgoing",
				message: responseText,
			});

			await sock.sendMessage(jid, { text: responseText }, { quoted: message });
		}
	});

	setInterval(async () => {
		await Promise.allSettled([
			pollNotifications(sock, botUser.id),
			pollResolvedComplaints(sock, botUser.id),
			pollInProgressComplaints(sock, botUser.id),
		]);
	}, 5_000);

	console.log("WhatsApp bot started");
};

const processCommand = async (
	tenant: Tenant,
	text: string,
): Promise<string> => {
	const lower = text.toLowerCase().trim();

	if (lower === "help") {
		return help(tenant);
	}

	const komplainkuMatch = lower.match(/^komplainku(?: (\d+))?$/);
	if (komplainkuMatch) {
		const id = komplainkuMatch[1];
		if (id) return checkComplaint(tenant, Number(id));
		return listComplaints(tenant);
	}

	if (lower === "komplain" || lower.startsWith("komplain ")) {
		return submitComplaint(tenant, text);
	}

	if (lower === "tagihan") {
		return checkBills(tenant);
	}

	if (lower === "riwayat") {
		return paymentHistory(tenant);
	}

	if (lower === "info") {
		return tenantInfo(tenant);
	}

	return render("unknown-command", {});
};

main();
