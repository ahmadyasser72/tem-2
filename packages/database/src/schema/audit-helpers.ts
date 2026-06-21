import microdiff, { type Difference } from "microdiff";

export const CRON_TABLES = ["invoices", "notifications"] as const;
export type CronTable = (typeof CRON_TABLES)[number];

export type AuditDetails =
	| { type: "create"; description: string; changes?: Difference[] }
	| { type: "update"; description: string; changes?: Difference[] }
	| { type: "delete"; description: string; changes?: Difference[] }
	| {
			type: "cron";
			description: string;
			table: CronTable;
			ids: number[];
	  }
	| {
			type: "bot";
			description: string;
			source: string;
			messagePreview?: string;
	  }
	| { type: "reject"; description: string; reason?: string }
	| {
			type: "payment";
			description: string;
			amount?: number;
			reference?: string;
	  }
	| {
			type: "notification";
			description: string;
			channel?: string;
			recipientId?: number;
	  }
	| {
			type: "generic";
			description: string;
	  };

/**
 * Type-safe audit detail builders
 */
export const auditDetail = {
	create: (
		description: string,
		newValues: Record<string, unknown>,
	): AuditDetails => ({
		type: "create",
		description,
		changes: microdiff({}, newValues),
	}),

	update: <T extends Record<string, unknown>>(
		description: string,
		oldValues: T,
		newValues: T,
	): AuditDetails => ({
		type: "update",
		description,
		changes: microdiff(oldValues, newValues),
	}),

	delete: (
		description: string,
		oldValues: Record<string, unknown>,
	): AuditDetails => ({
		type: "delete",
		description,
		changes: microdiff(oldValues, {}),
	}),

	cron: (
		description: string,
		table: CronTable,
		ids: number[],
	): AuditDetails => ({ type: "cron", description, table, ids }),

	bot: (
		description: string,
		source: string,
		messagePreview?: string,
	): AuditDetails => ({ type: "bot", description, source, messagePreview }),

	reject: (description: string, reason?: string): AuditDetails => ({
		type: "reject",
		description,
		reason,
	}),

	payment: (
		description: string,
		amount?: number,
		reference?: string,
	): AuditDetails => ({ type: "payment", description, amount, reference }),

	notification: (
		description: string,
		channel?: string,
		recipientId?: number,
	): AuditDetails => ({
		type: "notification",
		description,
		channel,
		recipientId,
	}),

	generic: (description: string): AuditDetails => ({
		type: "generic",
		description,
	}),
};
