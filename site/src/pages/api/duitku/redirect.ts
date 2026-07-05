import { parseInvoiceNumber } from "@indekos/utilities/transforms";

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, redirect }) => {
	const merchantOrderId = url.searchParams.get("merchantOrderId") ?? "";
	const invoiceId = parseInvoiceNumber(merchantOrderId);

	return redirect(`/invoice/${invoiceId}`);
};
