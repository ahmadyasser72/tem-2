import { db } from "@e-kos/database";
import { tenants } from "@e-kos/database/schema";
import { formatDate } from "@e-kos/utilities/date";

import { render } from "../template";
import { STATUS_LABEL } from "./constants";

export const listComplaints = async (tenant: typeof tenants.$inferSelect) => {
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
