import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	"/dashboard/log/chatbot/report/html",
	"laporan_chatbot",
);
