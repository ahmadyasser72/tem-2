import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/log/audit/report/html",
	"laporan_aktivitas",
);
