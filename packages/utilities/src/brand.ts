import { watch } from "fs";
import path from "path";

import { MONOREPO_ROOT } from "./monorepo";

interface BrandConfig {
	siteName: string;
	siteTagline: string;
	address: string;
	phone: string;
}

const BRAND_DEFAULT = {
	siteName: "Indekos Ungu",
	siteTagline: "Sistem Manajemen Indekos",
	address:
		"Jl. Sejahtera, Komplek Damai, RT 002/RW 006, Kelurahan Mentaos, Kec. Banjarbaru Utara, Kota Banjar Baru, Kalimantan Selatan 70714",
	phone: "+62 896-7268-4032",
} satisfies BrandConfig;

export const BRAND_FILE = path.join(MONOREPO_ROOT, "brand.json");
const ensureConfig = async () => {
	const configFile = Bun.file(BRAND_FILE);
	if (!(await configFile.exists())) {
		await configFile.write(JSON.stringify(BRAND_DEFAULT));
	}
};

export const config: BrandConfig = await (async () => {
	await ensureConfig();

	watch(path.dirname(BRAND_FILE), {}, async (event, name) => {
		if (name !== "brand.json") return;

		if (event === "rename") await ensureConfig();

		const json = await Bun.file(BRAND_FILE).json();
		Object.assign(config, { ...BRAND_DEFAULT, ...json });
	});

	return Bun.file(BRAND_FILE)
		.json()
		.then((json) => ({ ...BRAND_DEFAULT, ...json }));
})();
