import { defineRelations } from "drizzle-orm";

import * as schema from ".";

export const relations = defineRelations(schema, (r) => ({
	users: {
		logs: r.many.auditLogs({
			from: r.users.id,
			to: r.auditLogs.userId,
		}),
	},

	tenants: {
		room: r.one.rooms({
			from: r.tenants.id.through(r.leases.tenantId),
			to: r.rooms.id.through(r.leases.roomId),
		}),
		invoices: r.many.invoices({
			from: r.tenants.id.through(r.leases.tenantId),
			to: r.invoices.leaseId.through(r.leases.id),
		}),

		chatbotInteractions: r.many.chatbotMessages({
			from: r.tenants.id,
			to: r.chatbotMessages.tenantId,
		}),
		complaintsGiven: r.many.complaints({
			from: r.tenants.id,
			to: r.complaints.tenantId,
		}),
		notificationReceived: r.many.notifications({
			from: r.tenants.id,
			to: r.notifications.tenantId,
		}),
	},
}));
