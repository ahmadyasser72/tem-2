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

export default dayjs;
