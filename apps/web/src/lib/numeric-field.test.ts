import { describe, expect, it } from "vitest";
import {
	MAX_DB_INT,
	parseTicketPrice,
	parseWholeNumber,
	toPreviewAmount,
} from "./numeric-field";

describe("parseWholeNumber", () => {
	const rules = { label: "Capacity", min: 1 };

	it("accepts values other than 300 and returns them unchanged", () => {
		expect(parseWholeNumber("100", rules)).toEqual({ ok: true, value: 100 });
		expect(parseWholeNumber("1", rules)).toEqual({ ok: true, value: 1 });
		expect(parseWholeNumber("  42 ", rules)).toEqual({ ok: true, value: 42 });
	});

	it("rejects an empty field instead of substituting a default", () => {
		expect(parseWholeNumber("", rules)).toEqual({
			ok: false,
			error: "Capacity is required.",
		});
		expect(parseWholeNumber("   ", rules).ok).toBe(false);
	});

	it("rejects zero, negatives, decimals and non-numeric text", () => {
		expect(parseWholeNumber("0", rules).ok).toBe(false);
		expect(parseWholeNumber("-5", rules).ok).toBe(false);
		expect(parseWholeNumber("2.5", rules).ok).toBe(false);
		expect(parseWholeNumber("1e3", rules).ok).toBe(false);
		expect(parseWholeNumber("abc", rules).ok).toBe(false);
	});

	it("enforces an explicit max", () => {
		const limited = { label: "Max per order", min: 1, max: 10 };
		expect(parseWholeNumber("10", limited)).toEqual({ ok: true, value: 10 });
		expect(parseWholeNumber("11", limited).ok).toBe(false);
	});

	it("rejects values above the database integer range", () => {
		expect(parseWholeNumber(String(MAX_DB_INT), rules).ok).toBe(true);
		expect(parseWholeNumber(String(MAX_DB_INT + 1), rules).ok).toBe(false);
	});
});

describe("parseTicketPrice", () => {
	const rules = { label: "Ticket price", min: 1 };

	it("accepts whole-rupee prices", () => {
		expect(parseTicketPrice("499", rules)).toEqual({ ok: true, value: 499 });
		expect(parseTicketPrice("499.00", rules)).toEqual({ ok: true, value: 499 });
	});

	it("rejects empty input", () => {
		expect(parseTicketPrice("", rules)).toEqual({
			ok: false,
			error: "Ticket price is required.",
		});
	});

	it("rejects fractional prices with an explanation instead of rounding", () => {
		const result = parseTicketPrice("99.5", rules);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("whole number of rupees");
		}
	});

	it("rejects invalid text and amounts below the minimum", () => {
		expect(parseTicketPrice("abc", rules).ok).toBe(false);
		expect(parseTicketPrice("-1", rules).ok).toBe(false);
		expect(parseTicketPrice("0", rules).ok).toBe(false);
		expect(parseTicketPrice("0", { label: "Ticket price", min: 0 }).ok).toBe(
			true,
		);
	});
});

describe("toPreviewAmount", () => {
	it("keeps decimals so the live preview follows every keystroke", () => {
		expect(toPreviewAmount("99.5")).toBe(99.5);
		expect(toPreviewAmount("1000")).toBe(1000);
	});

	it("treats empty or invalid input as 0 for display only", () => {
		expect(toPreviewAmount("")).toBe(0);
		expect(toPreviewAmount("abc")).toBe(0);
		expect(toPreviewAmount("-3")).toBe(0);
	});
});
