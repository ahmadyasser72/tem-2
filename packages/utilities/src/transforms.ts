import type { Invoice } from "@indekos/database/schema";

import { formatDate } from "./date";

/**
 * Format invoice number as INV-{YYYYMM}/{ID}
 */
export const formatInvoiceNumber = ({
	id,
	dueDate,
}: Pick<Invoice, "id" | "dueDate">): string =>
	`INV-${formatDate(dueDate, "YYYYMM")}/${id}`;

/**
 * Format currency in Indonesian Rupiah format
 */
export const formatCurrency = (amount: number): string =>
	`Rp ${amount.toLocaleString("id-ID")}`;
