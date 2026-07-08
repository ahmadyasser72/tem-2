import { BRAND_FILE } from "@indekos/utilities/brand";

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

export const update = defineAction({
	accept: "form",
	input: z.object({
		siteName: z.string().nonempty("Nama situs tidak boleh kosong"),
		siteTagline: z.string().nonempty("Tagline tidak boleh kosong"),
		address: z.string().nonempty("Alamat tidak boleh kosong"),
		phone: z.string().nonempty("Nomor telepon tidak boleh kosong"),
	}),
	handler: async (input, context) => {
		const user = context.locals.user!;
		if (user.role !== "admin" && user.role !== "owner") {
			throw new ActionError({
				code: "FORBIDDEN",
				message: "Hanya admin dan owner yang dapat mengubah branding.",
			});
		}

		try {
			await Bun.write(BRAND_FILE, JSON.stringify(input, null, 4));
			await Bun.sleep(300); // fs watcher delay
		} catch (error) {
			console.error("brand.update: file write error", {
				error,
				userId: user.id,
			});

			throw new ActionError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Gagal menyimpan perubahan branding.",
			});
		}
	},
});
