import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/manage/invoices/report/html",
	"rekap_tagihan",
);
