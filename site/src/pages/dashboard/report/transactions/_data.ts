import { db, INVOICE_STATUS } from "@e-kos/database";
import { getPaymentUrlFromReference } from "@e-kos/database/duitku";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import { parseDateRange } from "~/lib/date";
import { periodFields, querySchema, statusSchema } from "~/lib/query";
import { formatInvoiceNumber } from "~/lib/transforms";

export { INVOICE_STATUS };

export const fetchTransactions = async (
	params: z.infer<typeof transactionQuerySchema>,
) => {
	const { startDate, endDate } = parseDateRange(params.from, params.to);

	const invoices = await db.query.invoices.findMany({
		where: {
			...(params.query && {
				OR: [
					{ lease: { tenant: { fullName: { like: `%${params.query}%` } } } },
					{ lease: { room: { roomNumber: { like: `%${params.query}%` } } } },
				],
			}),

			...(params.status && { status: params.status }),

			dueDate: { gte: startDate, lte: endDate },
		},
		with: {
			lease: {
				with: { tenant: true, room: true },
			},
		},
	});

	return invoices.map(({ lease, ...invoice }) => ({
		...invoice,
		invoiceNumber: formatInvoiceNumber(invoice.id),
		tenantName: lease.tenant.fullName,
		roomNumber: lease.room.roomNumber,
		paymentUrl: invoice.duitkuReference
			? getPaymentUrlFromReference(invoice.duitkuReference)
			: null,
	}));
};

export const getTransactionStats = (
	transactions: Awaited<ReturnType<typeof fetchTransactions>>,
) => {
	const paid = transactions.filter(
		(transaction) => transaction.status === "paid",
	);
	const unpaid = transactions.filter(
		(transaction) => transaction.status !== "paid",
	);

	return {
		totalRevenue: sumBy(paid, (transaction) => transaction.amount),
		paidCount: paid.length,
		unpaidCount: unpaid.length,
		outstandingAmount: sumBy(unpaid, (transaction) => transaction.amount),
	};
};

export const transactionQuerySchema = z.object({
	query: querySchema,
	...periodFields,
	status: statusSchema(INVOICE_STATUS),
});

export const INVOICE_STATUS_BADGES = {
	unpaid: "badge-warning",
	paid: "badge-success",
	overdue: "badge-error",
} satisfies Record<(typeof INVOICE_STATUS)[number], string>;

export const INVOICE_STATUS_LABELS = {
	unpaid: "Belum Bayar",
	paid: "Lunas",
	overdue: "Terlambat",
} satisfies Record<(typeof INVOICE_STATUS)[number], string>;
