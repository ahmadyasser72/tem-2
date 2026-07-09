import { db } from "@indekos/database";
import { formatDate } from "@indekos/utilities/date";
import { formatCurrency } from "@indekos/utilities/transforms";

import { render } from "~/template";
import type { CommandHandlerFunction } from "./types";

export const tenantInfo: CommandHandlerFunction = async (tenant, options) => {
	const log = options?.logger?.child({ submodule: "commands:tenant-info" });

	log?.debug({ tenantId: tenant.id }, "retrieving tenant information");

	try {
		const activeLease = await db.query.leases.findFirst({
			where: { tenantId: tenant.id, isActive: true },
			with: { room: true, invoices: { where: { status: "unpaid" } } },
		});

		if (!activeLease?.room) {
			log?.info({ tenantId: tenant.id }, "no active lease found");
			return "Anda tidak memiliki kontrak sewa yang aktif.";
		}

		const hasUnpaid = activeLease.invoices.length > 0;

		log?.info(
			{
				tenantId: tenant.id,
				leaseId: activeLease.id,
				hasUnpaid: hasUnpaid,
			},
			"tenant information retrieved successfully",
		);

		return render("tenant-info", {
			fullName: tenant.fullName,
			phoneNumber: tenant.phoneNumber,
			originRegion: tenant.originRegion ?? "-",
			roomNumber: activeLease.room.roomNumber,
			roomType: activeLease.room.roomType,
			monthlyPrice: formatCurrency(activeLease.room.monthlyPrice),
			startDate: formatDate(activeLease.startDate),
			endDate: activeLease.endDate
				? formatDate(activeLease.endDate)
				: "Berlangsung",
			hasUnpaid,
		});
	} catch (error) {
		log?.error(
			{ error, tenantId: tenant.id },
			"failed to retrieve tenant information",
		);
		throw error;
	}
};
