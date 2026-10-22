/**
 * Helpers for numeric form inputs that are held as strings while the user
 * edits them. Keeping the raw string in React state means clearing a field or
 * typing a replacement never produces a forced "0". Conversion to a number
 * happens only here, at save time or for display calculations.
 */

/** Largest value a Postgres `Int` column (Prisma `Int`) can hold. */
export const MAX_DB_INT = 2_147_483_647;

export type NumericFieldResult =
	| { ok: true; value: number }
	| { ok: false; error: string };

export interface WholeNumberRules {
	/** Human-readable field name used in error messages. */
	label: string;
	min: number;
	max?: number;
}

/**
 * Parse a whole-number field (capacity, max per order, ...). Empty or invalid
 * input returns an error instead of a silent default.
 */
export function parseWholeNumber(
	raw: string,
	rules: WholeNumberRules,
): NumericFieldResult {
	const text = raw.trim();
	if (text === "") {
		return { ok: false, error: `${rules.label} is required.` };
	}
	if (!/^\d+$/.test(text)) {
		return { ok: false, error: `${rules.label} must be a whole number.` };
	}

	const value = Number(text);
	const max = rules.max ?? MAX_DB_INT;
	if (!Number.isSafeInteger(value) || value > max) {
		return {
			ok: false,
			error: `${rules.label} must be at most ${max.toLocaleString("en-IN")}.`,
		};
	}
	if (value < rules.min) {
		return {
			ok: false,
			error: `${rules.label} must be at least ${rules.min}.`,
		};
	}
	return { ok: true, value };
}

/**
 * Parse a ticket price for saving. The database column stores whole rupees
 * (Prisma `Int`), so a decimal price is rejected with an explanation rather
 * than rounded.
 */
export function parseTicketPrice(
	raw: string,
	rules: { label: string; min: number },
): NumericFieldResult {
	const text = raw.trim();
	if (text === "") {
		return { ok: false, error: `${rules.label} is required.` };
	}
	if (!/^\d+(\.\d+)?$/.test(text)) {
		return { ok: false, error: `${rules.label} must be a valid amount.` };
	}
	if (text.includes(".") && !/^\d+\.0*$/.test(text)) {
		return {
			ok: false,
			error: `${rules.label} must be a whole number of rupees; decimal prices are not supported yet.`,
		};
	}

	const value = Math.trunc(Number(text));
	if (!Number.isSafeInteger(value) || value > MAX_DB_INT) {
		return {
			ok: false,
			error: `${rules.label} must be at most ${MAX_DB_INT.toLocaleString("en-IN")}.`,
		};
	}
	if (value < rules.min) {
		return {
			ok: false,
			error: `${rules.label} must be at least ${rules.min}.`,
		};
	}
	return { ok: true, value };
}

/**
 * Convert in-progress input to a number for live calculations (price preview).
 * Decimals are kept so the preview responds to every keystroke. Empty or
 * invalid input counts as 0 for display only; it is never used for saving.
 */
export function toPreviewAmount(raw: string): number {
	const value = Number(raw);
	return Number.isFinite(value) && value > 0 ? value : 0;
}
