import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import "dayjs/locale/id";

dayjs.locale("id");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Makassar");

export const formatDate = (
	date: Date | string | number | null | undefined,
	formatStr = "DD MMM YYYY",
): string => {
	if (!date) return "-";
	return dayjs(date).format(formatStr);
};

export const getCurrentMonthStr = (): string => dayjs().format("YYYY-MM");

export const parsePeriod = (from: string, to: string) => {
	const startDate = dayjs(from + "-01")
		.startOf("month")
		.toDate();
	const endDate = dayjs(to + "-01")
		.endOf("month")
		.toDate();

	return { startDate, endDate };
};

export const normalizePeriodRange = (
	from: string,
	to: string,
): { from: string; to: string } => {
	if (from > to) {
		return { from, to: from };
	}
	return { from, to };
};

export const parseDateRange = (
	from?: string | null,
	to?: string | null,
	mode: "month" | "day" = "month",
): { startDate?: Date; endDate?: Date } => {
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
};

export default dayjs;
