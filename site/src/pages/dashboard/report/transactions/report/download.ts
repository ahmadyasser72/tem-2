import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/report/transactions/report/html",
	"laporan_transaksi",
);
