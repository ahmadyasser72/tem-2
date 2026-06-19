import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/manage/rooms/report/html",
	"rekap_kamar",
);
