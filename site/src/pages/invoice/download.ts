import { makeDownloadHandler } from "~/lib/pdf";

export const GET = makeDownloadHandler(
	(url: URL) => url.pathname.replace(/\/download$/, ""),
	(url: URL) => {
		const match = url.pathname.match(/\/invoice\/(\d+)/);
		return `invoice_${match?.[1] ?? "unknown"}`;
	},
);
