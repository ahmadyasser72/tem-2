import { describe, expect, it } from "bun:test";

import {
	formatDate,
	getCurrentMonthStr,
	normalizePeriodRange,
} from "../date.ts";

describe("formatDate", () => {
	it("returns '-' for null date", () => {
		expect(formatDate(null)).toBe("-");
	});

	it("returns '-' for undefined date", () => {
		expect(formatDate(undefined)).toBe("-");
	});

	it("formats a Date object with default format", () => {
		const date = new Date(2025, 0, 15); // Jan 15, 2025
		expect(formatDate(date)).toBe("15 Jan 2025");
	});

	it("formats a date string", () => {
		expect(formatDate("2025-06-01")).toBe("01 Jun 2025");
	});

	it("uses custom format string", () => {
		const date = new Date(2025, 5, 15);
		expect(formatDate(date, "YYYY-MM-DD")).toBe("2025-06-15");
	});
});

describe("getCurrentMonthStr", () => {
	it("returns current month in YYYY-MM format", () => {
		const now = new Date();
		const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		expect(getCurrentMonthStr()).toBe(expected);
	});
});

describe("normalizePeriodRange", () => {
	it("returns same values when from <= to", () => {
		expect(normalizePeriodRange("2025-01", "2025-06")).toEqual({
			from: "2025-01",
			to: "2025-06",
		});
	});

	it("sets to = from when from > to", () => {
		expect(normalizePeriodRange("2025-06", "2025-01")).toEqual({
			from: "2025-06",
			to: "2025-06",
		});
	});
});
