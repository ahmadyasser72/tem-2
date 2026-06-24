/**
 * Format invoice number as INV-XXXXXX
 */
export const formatInvoiceNumber = (id: number): string =>
	`INV-${id.toString().padStart(6, "0")}`;

/**
 * Format currency in Indonesian Rupiah format
 */
export const formatCurrency = (amount: number): string =>
	`Rp ${amount.toLocaleString("id-ID")}`;
