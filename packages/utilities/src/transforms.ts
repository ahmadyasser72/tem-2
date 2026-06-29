import { formatDate } from "./date";

/**
 * Format invoice number as INV-{YYYYMM}/{ID}
 */
export const formatInvoiceNumber = (id: number, date: Date): string =>
	`INV-${formatDate(date, "YYYYMM")}/${id}`;

/**
 * Format currency in Indonesian Rupiah format
 */
export const formatCurrency = (amount: number): string =>
	`Rp ${amount.toLocaleString("id-ID")}`;
