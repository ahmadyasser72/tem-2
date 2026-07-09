import { db } from "@indekos/database";
import { formatDate } from "@indekos/utilities/date";

import { render } from "~/template";
import { STATUS_LABEL } from "./constants";
import type { CommandHandlerFunction } from "./types";

export const checkComplaint: CommandHandlerFunction<[number]> = async (
	tenant,
	complaintId,
	options,
) => {
	const log = options?.logger?.child({ submodule: "commands:check-complaint" });

	log?.debug(
		{ tenantId: tenant.id, complaintId: complaintId },
		"retrieving complaint details",
	);

	try {
		const complaint = await db.query.complaints.findFirst({
			where: { id: complaintId, tenantId: tenant.id },
		});

		if (!complaint) {
			log?.info(
				{ tenantId: tenant.id, complaintId: complaintId },
				"complaint not found",
			);
			return "Komplain dengan ID tersebut tidak ditemukan.";
		}

		let resolverName = "-";
		if (complaint.resolvedBy) {
			const resolver = await db.query.users.findFirst({
				where: { id: complaint.resolvedBy },
			});
			if (resolver) resolverName = resolver.displayName ?? resolver.username;
		}

		log?.info(
			{
				tenantId: tenant.id,
				complaintId: complaintId,
				status: complaint.status,
			},
			"complaint details retrieved successfully",
		);

		return render("check-complaint", {
			id: complaint.id,
			description: complaint.description,
			createdAt: formatDate(complaint.createdAt),
			processedAt: complaint.processedAt
				? formatDate(complaint.processedAt)
				: null,
			resolvedAt: complaint.resolvedAt
				? formatDate(complaint.resolvedAt)
				: null,
			status: STATUS_LABEL[complaint.status],
			resolveNotes: complaint.resolveNotes ?? null,
			resolverName,
		});
	} catch (error) {
		log?.error(
			{
				error,
				tenantId: tenant.id,
				complaintId: complaintId,
			},
			"failed to retrieve complaint details",
		);
		throw error;
	}
};
