import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import "dayjs/locale/id";

dayjs.locale("id");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Makassar");
dayjs.extend(relativeTime);

export const formatDate = (
	date: Date | string | number | null | undefined,
	formatStr = "DD MMM YYYY",
): string => {
	if (!date) return "-";
	return dayjs(date).format(formatStr);
};

export const getCurrentMonthStr = (): string => dayjs().format("YYYY-MM");

export const parsePeriod = (from: string, to: string) => {
	const startDate = dayjs(`${from}-01`).startOf("month").toDate();
	const endDate = dayjs(`${to}-01`).endOf("month").toDate();

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

export const parseDateRange = (from: string, to: string) => {
	const fromStr = from ?? getCurrentMonthStr();
	const toStr = to ?? fromStr;
	const normalized = normalizePeriodRange(fromStr, toStr);
	return parsePeriod(normalized.from, normalized.to);
};

export default dayjs;
