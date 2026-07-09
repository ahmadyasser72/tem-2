import { db } from "@indekos/database";
import { formatDate } from "@indekos/utilities/date";
import {
	formatCurrency,
	formatInvoiceNumber,
} from "@indekos/utilities/transforms";

import { render } from "~/template";
import type { CommandHandlerFunction } from "./types";

export const paymentHistory: CommandHandlerFunction = async (
	tenant,
	options,
) => {
	const log = options?.logger?.child({
		submodule: "commands:payment-history",
	});

	log?.debug({ tenantId: tenant.id }, "retrieving payment history");

	try {
		const lease = await db.query.leases.findFirst({
			columns: { id: true },
			where: { tenantId: tenant.id, isActive: true },
			with: {
				invoices: {
					where: { status: "paid" },
					limit: 10,
				},
			},
		});

		if (!lease) {
			log?.info({ tenantId: tenant.id }, "no active lease found");
			return "Anda tidak memiliki riwayat pembayaran.";
		} else if (lease.invoices.length === 0) {
			log?.info({ tenantId: tenant.id }, "no paid invoices found");
			return "Belum ada riwayat pembayaran lunas.";
		}

		log?.info(
			{
				tenantId: tenant.id,
				leaseId: lease.id,
				paidCount: lease.invoices.length,
			},
			"payment history retrieved successfully",
		);

		return render("payment-history", {
			paid: lease.invoices.map(({ id, amount, dueDate }) => ({
				id: formatInvoiceNumber({ id, dueDate }),
				amount: formatCurrency(amount),
				dueDate: formatDate(dueDate),
			})),
		});
	} catch (error) {
		log?.error(
			{ error, tenantId: tenant.id },
			"failed to retrieve payment history",
		);
		throw error;
	}
};
