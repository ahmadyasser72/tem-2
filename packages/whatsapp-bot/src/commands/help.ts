import type { Tenant } from "@indekos/database/schema";

import { render } from "~/template";

export const help = (tenant: Tenant): string =>
	render("help", { fullName: tenant.fullName });
