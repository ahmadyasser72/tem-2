import { describe, expect, it } from "bun:test";

import { help } from "../help";

describe("help", () => {
	it("returns bot commands list", () => {
		const result = help();
		expect(result).toContain("E-Kos Bot Assistant");
		expect(result).toContain("*tagihan*");
		expect(result).toContain("*riwayat*");
		expect(result).toContain("*komplain*");
		expect(result).toContain("*help*");
	});

	it("contains all available commands", () => {
		const result = help();
		expect(result).toContain("*info*");
		expect(result).toContain("*komplainku*");
	});
});
