import { db } from "@indekos/database";
import { complaints, type Tenant } from "@indekos/database/schema";
import { formatDate } from "@indekos/utilities/date";
import { sendPush } from "@indekos/utilities/push";

import { render } from "../template";

export const submitComplaint = async (
	tenant: Tenant,
	text: string,
): Promise<string> => {
	const complaintDescription = text.replace(/^komplain\s*/i, "").trim();
	if (!complaintDescription || complaintDescription.length < 5) {
		return render("submit-complaint-format", {});
	}

	const [newComplaint] = await db
		.insert(complaints)
		.values({
			tenantId: tenant.id,
			description: complaintDescription,
			status: "open",
		})
		.returning({ id: complaints.id, createdAt: complaints.createdAt });

	const users = await db.query.users.findMany({
		where: { role: { in: ["staff", "owner"] } },
	});

	await sendPush(users, {
		title: `Komplain Baru dari ${tenant.fullName}`,
		body: complaintDescription,
		url: `/dashboard/complaints/${newComplaint.id}`,
	});

	return render("submit-complaint", {
		id: newComplaint.id,
		description: complaintDescription,
		createdAt: formatDate(newComplaint.createdAt),
	});
};
