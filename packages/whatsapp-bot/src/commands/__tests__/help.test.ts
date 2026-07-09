import { describe, expect, it } from "bun:test";
import { config } from "@indekos/utilities/brand";

import { help } from "../help";

const mockTenant = {
	id: 1,
	fullName: "Budi",
	phoneNumber: "08123456789",
	originRegion: "Jakarta",
	isVerified: true,
};

describe("help", () => {
	it("returns bot commands list with greeting", () => {
		const result = help(mockTenant);
		expect(result).toContain(config.siteName);
		expect(result).toContain("Budi");
		expect(result).toContain("*tagihan*");
		expect(result).toContain("*riwayat*");
		expect(result).toContain("*komplain*");
		expect(result).toContain("*help*");
	});

	it("contains all available commands", () => {
		const result = help(mockTenant);
		expect(result).toContain("*info*");
		expect(result).toContain("*komplainku*");
	});

	it("uses brand config from global config", () => {
		const result = help(mockTenant);
		expect(result).toContain(config.siteName);
	});
});
