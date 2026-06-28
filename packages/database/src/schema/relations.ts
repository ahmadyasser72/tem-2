import { defineRelations } from "drizzle-orm";

import * as schema from ".";

export const relations = defineRelations(schema, (r) => ({
	users: {
		logs: r.many.auditLogs({
			from: r.users.id,
			to: r.auditLogs.userId,
		}),
		resolvedComplaints: r.many.complaints({
			from: r.users.id,
			to: r.complaints.resolvedBy,
		}),
	},

	tenants: {
		leases: r.many.leases({
			from: r.tenants.id,
			to: r.leases.tenantId,
		}),
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

	rooms: {
		leaseHistory: r.many.leases({
			from: r.rooms.id,
			to: r.leases.roomId,
			where: { isActive: false },
		}),
		lease: r.one.leases({
			from: r.rooms.id,
			to: r.leases.roomId,
			where: { isActive: true },
		}),
	},

	leases: {
		tenant: r.one.tenants({
			from: r.leases.tenantId,
			to: r.tenants.id,
			optional: false,
		}),
		room: r.one.rooms({
			from: r.leases.roomId,
			to: r.rooms.id,
			optional: false,
		}),
		invoices: r.many.invoices({
			from: r.leases.id,
			to: r.invoices.leaseId,
		}),
	},

	invoices: {
		lease: r.one.leases({
			from: r.invoices.leaseId,
			to: r.leases.id,
		}),
		notifications: r.many.notifications({
			from: r.invoices.id,
			to: r.notifications.invoiceId,
		}),
	},

	complaints: {
		tenant: r.one.tenants({
			from: r.complaints.tenantId,
			to: r.tenants.id,
		}),
		resolver: r.one.users({
			from: r.complaints.resolvedBy,
			to: r.users.id,
		}),
	},

	auditLogs: {
		user: r.one.users({
			from: r.auditLogs.userId,
			to: r.users.id,
		}),
	},

	chatbotMessages: {
		tenant: r.one.tenants({
			from: r.chatbotMessages.tenantId,
			to: r.tenants.id,
		}),
		notification: r.one.notifications({
			from: r.chatbotMessages.id,
			to: r.notifications.chatbotMessageId,
		}),
	},

	notifications: {
		tenant: r.one.tenants({
			from: r.notifications.tenantId,
			to: r.tenants.id,
		}),
		invoice: r.one.invoices({
			from: r.notifications.invoiceId,
			to: r.invoices.id,
		}),
		chatbotMessage: r.one.chatbotMessages({
			from: r.notifications.chatbotMessageId,
			to: r.chatbotMessages.id,
		}),
	},
}));
