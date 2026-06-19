import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/report/notifications/report/html",
	"laporan_notifikasi",
);
