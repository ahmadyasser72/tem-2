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

export default dayjs;
