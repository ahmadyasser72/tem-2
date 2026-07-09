import { render } from "~/template";
import type { CommandHandlerFunction } from "./types";

export const help: CommandHandlerFunction = (tenant, options) => {
	const log = options?.logger?.child({ submodule: "commands:help" });

	log?.debug({ tenantId: tenant.id }, "rendering help message");

	return render("help", { fullName: tenant.fullName });
};
