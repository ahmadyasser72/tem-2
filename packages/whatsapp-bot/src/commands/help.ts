import { tenants } from "@e-kos/database/schema";

import { render } from "../template";

export const help = (tenant: typeof tenants.$inferSelect): string =>
	render("help", { fullName: tenant.fullName });
