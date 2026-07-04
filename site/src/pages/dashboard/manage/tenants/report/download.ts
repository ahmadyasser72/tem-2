import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/manage/tenants/report/html",
	"laporan_penghuni",
);
