import { db } from "@e-kos/database";
import { chatbotMessages, tenants } from "@e-kos/database/schema";

import { DisconnectReason, makeWASocket, useMultiFileAuthState } from "baileys";

import { checkBills } from "./commands/check-bills";
import { checkComplaint } from "./commands/check-complaint";
import { help } from "./commands/help";
import { listComplaints } from "./commands/list-complaints";
import { paymentHistory } from "./commands/payment-history";
import { submitComplaint } from "./commands/submit-complaint";
import { tenantInfo } from "./commands/tenant-info";
import { pollResolvedComplaints } from "./polls/complaints";
import { pollNotifications } from "./polls/notifications";

async function main() {
	const { state, saveCreds } = await useMultiFileAuthState("auth_info");

	const sock = makeWASocket({
		auth: state,
		printQRInTerminal: true,
	});

	sock.ev.on("creds.update", saveCreds);

	sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
		if (connection === "close") {
			const shouldReconnect =
				(lastDisconnect?.error as any)?.output?.statusCode !==
				DisconnectReason.loggedOut;
			if (shouldReconnect) main();
		} else if (connection === "open") {
			console.log("[Bot] WhatsApp connected");
		}
	});

	// ─── Handle incoming WhatsApp messages ─────────────────────
	sock.ev.on("messages.upsert", async ({ messages }) => {
		try {
			for (const message of messages) {
				if (message.key.fromMe) continue;

				const jid = message.key.remoteJid;
				if (!jid?.endsWith("@s.whatsapp.net")) continue;

				const phone = jid.replace("@s.whatsapp.net", "");
				const text = message.message?.conversation?.trim() || "";
				if (!text) continue;

				const tenant = await db.query.tenants.findFirst({
					where: { phoneNumber: phone },
				});

				if (!tenant) {
					await sock.sendMessage(jid, {
						text: "Maaf, nomor Anda tidak terdaftar sebagai penghuni kos. Silakan hubungi admin untuk informasi lebih lanjut.",
					});
					continue;
				}

				await db.insert(chatbotMessages).values({
					tenantId: tenant.id,
					direction: "incoming",
					message: text,
				});

				const responseText = await processCommand(tenant, text);

				await db.insert(chatbotMessages).values({
					tenantId: tenant.id,
					direction: "outgoing",
					message: responseText,
				});

				await sock.sendMessage(jid, { text: responseText });
			}
		} catch (err) {
			console.error("[Bot] Message handling error:", err);
		}
	});

	// ─── Polling tiap 30 detik ─────────────────────────────────
	setInterval(async () => {
		await pollNotifications(sock);
		await pollResolvedComplaints(sock);
	}, 30_000);

	console.log("[Bot] WhatsApp bot started");
}

// ─── Command processor ──────────────────────────────────────
async function processCommand(
	tenant: typeof tenants.$inferSelect,
	text: string,
): Promise<string> {
	const lower = text.toLowerCase().trim();

	if (lower === "help") {
		return help();
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

	return help();
}

main();
