import type { INVOICE_STATUS, USER_ROLES } from "@e-kos/database";

// User role badges — cross-domain, no single _data.ts owner
export const ROLE_BADGES: Record<(typeof USER_ROLES)[number], string> = {
	admin: "badge-primary",
	staff: "badge-secondary",
	owner: "badge-accent",
	system: "badge-ghost",
};

// Invoice status — used by transactions + invoices domains
export const INVOICE_STATUS_BADGES: Record<
	(typeof INVOICE_STATUS)[number],
	string
> = {
	unpaid: "badge-warning",
	paid: "badge-success",
	overdue: "badge-error",
};

export const INVOICE_STATUS_LABELS: Record<
	(typeof INVOICE_STATUS)[number],
	string
> = {
	unpaid: "Belum Bayar",
	paid: "Lunas",
	overdue: "Terlambat",
};

// Generic status colors for stat cards
