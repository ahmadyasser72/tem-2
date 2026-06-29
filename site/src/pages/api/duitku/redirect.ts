import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, redirect }) => {
	const merchantOrderId = url.searchParams.get("merchantOrderId") ?? "";
	const invoiceId = merchantOrderId.replace("INV-", "");

	return redirect(`/invoice/${invoiceId}`);
};
