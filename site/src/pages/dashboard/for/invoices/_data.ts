import { db, INVOICE_STATUS } from "@indekos/database";
import { getPaymentUrlFromReference } from "@indekos/database/duitku";
import {
	formatCurrency,
	formatInvoiceNumber,
} from "@indekos/utilities/transforms";

import { z } from "astro/zod";
import { sumBy } from "es-toolkit";

import type { Stat } from "~/components/data/stats.astro";
import { periodSchema, querySchema, statusSchema } from "~/lib/query";

export { INVOICE_STATUS };

export const fetchLeaseInvoices = async (
	params: z.infer<typeof invoiceQuerySchema>,
) => {
	const leases = await db.query.leases.findMany({
		where: {
			...(params.query && {
				OR: [
					{ tenant: { fullName: { like: `%${params.query}%` } } },
					{ room: { roomNumber: { like: `%${params.query}%` } } },
				],
			}),
		},
		with: {
			tenant: { columns: { fullName: true, phoneNumber: true } },
			room: { columns: { roomNumber: true } },
			invoices: {
				where: {
					...(params.status && { status: params.status }),
					dueDate: {
						gte: params.period.from.startOf("day").toDate(),
						lte: params.period.to.endOf("day").toDate(),
					},
				},
				orderBy: { dueDate: "asc" },
			},
		},
		orderBy: { isActive: "desc" },
	});

	// filter leases that have at least one invoice in range
	return leases
		.filter((lease) => lease.invoices.length > 0)
		.map((lease) => ({
			id: lease.id,
			tenantName: lease.tenant.fullName,
			phoneNumber: lease.tenant.phoneNumber,
			roomNumber: lease.room.roomNumber,
			startDate: lease.startDate,
			endDate: lease.endDate,
			isActive: lease.isActive,
			invoices: lease.invoices.map((invoice) => ({
				...invoice,
				invoiceNumber: formatInvoiceNumber(invoice),
				paymentUrl: invoice.duitkuReference
					? getPaymentUrlFromReference(invoice.duitkuReference)
					: null,
			})),
		}));
};

export type LeaseWithInvoices = Awaited<
	ReturnType<typeof fetchLeaseInvoices>
>[number];

export const getInvoiceStats = (leases: LeaseWithInvoices[]): Stat[] => {
	const allInvoices = leases.flatMap((l) => l.invoices);
	const paid = allInvoices.filter((i) => i.status === "paid");
	const unpaid = allInvoices.filter((i) => i.status !== "paid");
	const totalRevenue = sumBy(paid, ({ amount }) => amount);
	const paidRate =
		allInvoices.length > 0
			? Math.round((paid.length / allInvoices.length) * 100)
			: 0;

	return [
		{
			title: "Total Pemasukan",
			value: formatCurrency(totalRevenue),
			desc: `${paid.length} invoice terbayar`,
			icon: "lucide:arrow-up-right" as const,
		},
		{
			title: "Sudah Terbayar",
			value: `${paid.length} Invoice`,
			desc: `${paidRate}% dari total`,
			icon: "lucide:circle-check" as const,
		},
		{
			title: "Pembayaran Tertunggak",
			value: `${unpaid.length} Invoice`,
			desc: formatCurrency(sumBy(unpaid, ({ amount }) => amount)),
			icon: "lucide:x-circle" as const,
		},
	];
};

export const invoiceQuerySchema = z.object({
	query: querySchema,
	period: periodSchema,
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
