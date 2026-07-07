import { db } from "@indekos/database";
import type { Tenant } from "@indekos/database/schema";
import { formatDate } from "@indekos/utilities/date";

import { render } from "~/template";
import { STATUS_LABEL } from "./constants";

export const listComplaints = async (tenant: Tenant) => {
	const latest = await db.query.complaints.findMany({
		where: { tenantId: tenant.id },
		limit: 3,
	});

	if (latest.length === 0) {
		return "Belum ada komplain yang Anda kirimkan.";
	}

	return render("list-complaints", {
		items: latest.map(({ id, description, createdAt, status }) => ({
			id,
			description,
			createdAt: formatDate(createdAt),
			status: STATUS_LABEL[status],
		})),
	});
};
