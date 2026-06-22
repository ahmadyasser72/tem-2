import { DisconnectReason, makeWASocket } from "baileys";
import qrcode from "qrcode";

import { useSqliteAuthState } from "./auth";

async function login() {
	const { state, saveCreds } = await useSqliteAuthState();

	if (state.creds.me) return;

	const sock = makeWASocket({
		auth: state,
		shouldSyncHistoryMessage: () => false,
	});

	sock.ev.on("creds.update", saveCreds);
	sock.ev.on(
		"connection.update",
		async ({ connection, lastDisconnect, qr }) => {
			if (qr) {
				console.log(
					await qrcode.toString(qr, { type: "terminal", small: true }),
				);
			}

			if (connection === "open") {
				console.log("\nWhatsApp berhasil terhubung!");
				process.exit(0);
			}

			if (
				connection === "close" &&
				(lastDisconnect?.error as any)?.output?.statusCode !==
					DisconnectReason.loggedOut
			) {
				login();
			}
		},
	);
}

login();
