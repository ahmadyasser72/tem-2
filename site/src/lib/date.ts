import dayjs from "dayjs";

import "dayjs/locale/id";

dayjs.locale("id");

// register required dayjs plugins here

export function formatDate(
	date: Date | string | number | null | undefined,
	formatStr = "DD MMM YYYY",
): string {
	if (!date) return "-";
	return dayjs(date).format(formatStr);
}

export function getCurrentMonthStr(): string {
	const now = new Date();
	return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
}

export function parsePeriod(from: string, to: string) {
	// Parse start and end month
	const [fromYear, fromMonth] = from.split("-").map(Number);
	const [toYear, toMonth] = to.split("-").map(Number);
	const startDate = new Date(fromYear, fromMonth - 1, 1);
	const endDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999);

	return { startDate, endDate };
}

export function normalizePeriodRange(
	from: string,
	to: string,
): { from: string; to: string } {
	if (from > to) {
		return { from, to: from };
	}
	return { from, to };
}

export function getPeriodDefaults(): { from: string; to: string } {
	const current = getCurrentMonthStr();
	return { from: current, to: current };
}

export function parseDateRange(
	from?: string | null,
	to?: string | null,
	mode: "month" | "day" = "month",
): { startDate?: Date; endDate?: Date } {
	if (!from && !to) {
		return {};
	}

	if (mode === "month") {
		const fromStr = from ?? getCurrentMonthStr();
		const toStr = to ?? fromStr;
		const normalized = normalizePeriodRange(fromStr, toStr);
		return parsePeriod(normalized.from, normalized.to);
	}

	// Day mode - used in report pages
	let startDate: Date | undefined;
	let endDate: Date | undefined;

	if (from) {
		startDate = dayjs(from).startOf("day").toDate();
	}

	if (to) {
		endDate = dayjs(to).endOf("day").toDate();
	}

	return { startDate, endDate };
}

export default dayjs;
