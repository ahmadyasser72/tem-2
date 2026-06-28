import type { USER_ROLES } from "@e-kos/database";

export const ROLE_BADGES = {
	admin: "badge-primary",
	staff: "badge-secondary",
	owner: "badge-accent",
	system: "badge-ghost",
} satisfies Record<(typeof USER_ROLES)[number], string>;
