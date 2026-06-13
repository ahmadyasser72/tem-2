import type { APIRoute } from "astro";

// Pure redirect — meneruskan user ke halaman struk invoice digital
export const GET: APIRoute = async ({ url, redirect }) => {
	const merchantOrderId = url.searchParams.get("merchantOrderId") ?? "";
	const resultCode = url.searchParams.get("resultCode") ?? "";
	const reference = url.searchParams.get("reference") ?? "";
	const amount = url.searchParams.get("amount") ?? "";

	// Ekstrak invoice ID dari merchantOrderId (format: INV-XXXXXX)
	const invoiceId = merchantOrderId.replace("INV-", "");

	const params = new URLSearchParams();
	if (resultCode) params.set("resultCode", resultCode);
	if (reference) params.set("reference", reference);
	if (amount) params.set("amount", amount);

	const qs = params.toString();
	const dest = qs ? `/invoice/${invoiceId}?${qs}` : `/invoice/${invoiceId}`;

	return redirect(dest);
};
