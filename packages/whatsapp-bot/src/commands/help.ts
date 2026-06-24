export const help = (): string => {
	return [
		"*🤖 E-Kos Bot Assistant*",
		"",
		"Berikut perintah yang tersedia:",
		"",
		"• *tagihan* — Info tagihan yang belum dibayar",
		"• *riwayat* — Riwayat pembayaran lunas",
		"• *komplain* — Ajukan keluhan",
		"• *komplainku* — Daftar komplain / detail (contoh: komplainku 5)",
		"• *info* — Info kamar dan data diri",
		"• *help* — Tampilkan bantuan ini",
		"",
		"Ketik perintah yang diinginkan.",
	].join("\n");
};
