import { describe, expect, it } from "bun:test";

import { formatCurrency } from "../transforms.ts";

describe("formatCurrency", () => {
	it("formats amount in Indonesian Rupiah format", () => {
		expect(formatCurrency(150000)).toBe("Rp 150.000");
	});

	it("formats zero correctly", () => {
		expect(formatCurrency(0)).toBe("Rp 0");
	});

	it("formats large numbers with grouping separators", () => {
		expect(formatCurrency(2500000)).toBe("Rp 2.500.000");
	});
});
