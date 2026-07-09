import type { MessageInput } from "~/conversation/types";
import { submitComplaintResponse } from "~/lib/complaint";
import { render } from "~/template";
import type { CommandHandlerFunction } from "./types";

export const submitComplaint: CommandHandlerFunction<
	[string, MessageInput["image"]]
> = async (tenant, text, image, options) => {
	const log = options?.logger?.child({
		submodule: "commands:submit-complaint",
	});

	log?.debug(
		{ tenantId: tenant.id, hasImage: !!image },
		"processing complaint submission",
	);

	if (!tenant.lease) {
		log?.info({ tenantId: tenant.id }, "no active lease for complaint");
		return render("no-lease-complaint", {});
	}

	try {
		const result = await submitComplaintResponse(tenant, text, image);
		log?.info({ tenantId: tenant.id }, "complaint submitted successfully");
		return result;
	} catch (error) {
		log?.error({ error, tenantId: tenant.id }, "failed to submit complaint");
		throw error;
	}
};
