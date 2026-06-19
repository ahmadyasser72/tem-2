import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/manage/complaints/report/html",
	"laporan_komplain",
);
