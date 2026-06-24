import { describe, expect, it } from "bun:test";

import { checkActionResult } from "../form-result.ts";

describe("checkActionResult", () => {
	it("returns error result when result has error message", () => {
		const result = { error: { message: "Something went wrong" } };

		const output = checkActionResult(result, {
			title: "Should not appear",
			getDescription: () => "",
		});

		expect(output).toEqual({
			success: false,
			message: "Something went wrong",
		});
	});

	it("returns success result when result has data", () => {
		const result = { data: { id: 1, name: "test" } };

		const output = checkActionResult(result, {
			title: "Created",
			getDescription: (data) => `Item ${data.name} created`,
		});

		expect(output).toEqual({
			success: true,
			title: "Created",
			description: "Item test created",
		});
	});

	it("returns undefined when no error and no data", () => {
		const result = {};

		const output = checkActionResult(result, {
			title: "Unused",
			getDescription: () => "",
		});

		expect(output).toBeUndefined();
	});

	it("prefers error over data when both present", () => {
		const result = {
			error: { message: "Validation failed" },
			data: { id: 1 },
		};

		const output = checkActionResult(result, {
			title: "Created",
			getDescription: () => "desc",
		});

		expect(output).toEqual({
			success: false,
			message: "Validation failed",
		});
	});
});
