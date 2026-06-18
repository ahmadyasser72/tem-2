import { DisconnectReason, makeWASocket } from "baileys";
import qrcode from "qrcode-terminal";

import { useSqliteAuthState } from "./auth";

async function login() {
	const { state, saveCreds } = await useSqliteAuthState();

	if (state.creds.me) return;

	const sock = makeWASocket({
		auth: state,
	});

	sock.ev.on("creds.update", saveCreds);

	sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
		if (qr) {
			console.log("\n[Login] Scan QR code berikut dengan WhatsApp Anda:\n");
			qrcode.generate(qr, { small: true });
		}

		if (connection === "open") {
			console.log(
				"\n[Login] WhatsApp berhasil terhubung! Silakan jalankan bot utama.",
			);
			process.exit(0);
		}

		if (connection === "close") {
			const shouldReconnect =
				(lastDisconnect?.error as any)?.output?.statusCode !==
				DisconnectReason.loggedOut;
			if (shouldReconnect) {
				console.log("[Login] Koneksi terputus, mencoba ulang...");
			} else {
				console.error(
					"[Login] Sesi WhatsApp telah logout. Jalankan ulang login.",
				);
				process.exit(1);
			}
		}
	});
}

login();
