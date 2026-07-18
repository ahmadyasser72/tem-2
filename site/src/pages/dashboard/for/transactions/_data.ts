import { db } from "@indekos/database";
import {
	formatCurrency,
	formatInvoiceNumber,
} from "@indekos/utilities/transforms";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import type { Stat } from "~/components/data/stats.astro";
import { periodSchema, querySchema, statusSchema } from "~/lib/query";

export const TRANSACTION_STATUSES = ["paid", "overdue"] as const;

export const fetchTransactions = async (
	params: z.infer<typeof transactionQuerySchema>,
) => {
	const invoices = await db.query.invoices.findMany({
		where: {
			...(params.query && {
				OR: [
					{ lease: { tenant: { fullName: { like: `%${params.query}%` } } } },
					{ lease: { room: { roomNumber: { like: `%${params.query}%` } } } },
				],
			}),

			status: params.status ?? { notIn: ["unpaid"] },

			dueDate: {
				gte: params.period.from.startOf("day").toDate(),
				lte: params.period.to.endOf("day").toDate(),
			},
		},
		with: {
			lease: {
				with: { tenant: true, room: true },
			},
		},
	});

	return invoices.map(({ lease, ...invoice }) => ({
		...invoice,
		invoiceNumber: formatInvoiceNumber(invoice),
		tenantName: lease.tenant.fullName,
		roomNumber: lease.room.roomNumber,
	}));
};

export const getTransactionStats = (
	transactions: Awaited<ReturnType<typeof fetchTransactions>>,
): Stat[] => {
	const paid = transactions.filter(({ status }) => status === "paid");
	const overdue = transactions.filter(({ status }) => status === "overdue");
	const totalRevenue = sumBy(paid, ({ amount }) => amount);
	const paidCount = paid.length;
	const paidRate =
		transactions.length > 0
			? Math.round((paidCount / transactions.length) * 100)
			: 0;
	const overdueCount = overdue.length;
	const overdueTotal = sumBy(overdue, ({ amount }) => amount);

	return [
		{
			title: "Total Pemasukan",
			value: formatCurrency(totalRevenue),
			desc: `${paid.length} invoice terbayar`,
			icon: "lucide:arrow-up-right" as const,
		},
		{
			title: "Sudah Terbayar",
			value: `${paidCount} Invoice`,
			desc: `${paidRate}% dari total`,
			icon: "lucide:circle-check" as const,
		},
		{
			title: "Terlambat",
			value: `${overdueCount} Invoice`,
			desc: formatCurrency(overdueTotal),
			icon: "lucide:x-circle" as const,
		},
	];
};

export const transactionQuerySchema = z.object({
	query: querySchema,
	period: periodSchema,
	status: statusSchema(TRANSACTION_STATUSES),
});
