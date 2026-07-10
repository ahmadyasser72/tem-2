import { createLogger } from "@indekos/utilities/logger";

import { DisconnectReason, makeWASocket } from "baileys";
import { renderUnicodeCompact } from "uqr";

import { useSqliteAuthState } from "./auth";

const log = createLogger("whatsapp-bot").child({ submodule: "auth:login" });

const login = async () => {
	log.info("initiating whatsapp authentication");

	try {
		const { state, saveCreds } = await useSqliteAuthState();

		if (state.creds.me) {
			log.info("existing credentials found, already authenticated");
			return;
		}

		const sock = makeWASocket({ auth: state });

		sock.ev.on("creds.update", saveCreds);

		sock.ev.on(
			"connection.update",
			async ({ connection, lastDisconnect, qr }) => {
				if (qr) {
					log.info("qr code generated");
					console.log(
						"\nScan QR code berikut dengan aplikasi WhatsApp Anda:\n",
					);
					console.log(renderUnicodeCompact(qr));
					console.log("\n");
				}

				if (connection === "open") {
					log.info("whatsapp connection established successfully");

					process.exit(0);
				}

				if (
					connection === "close" &&
					(lastDisconnect?.error as any)?.output?.statusCode !==
						DisconnectReason.loggedOut
				) {
					log.warn(
						{
							statusCode: (lastDisconnect?.error as any)?.output?.statusCode,
						},
						"connection closed, retrying",
					);
					login();
				}
			},
		);
	} catch (error) {
		log.error({ error }, "authentication failed");
		throw error;
	}
};

login();
