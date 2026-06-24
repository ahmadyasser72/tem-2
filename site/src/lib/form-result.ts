import type { ActionClient } from "astro:actions";

export type FormResult =
	| { success: false; message: string }
	| { success: true; title: string; description: string }
	| void;

export const createActionResult = <TAction extends ActionClient<any, any, any>>(
	action: TAction,
	title: string,
	getDescription: (data: any) => string,
) => {
	return { action, title, getDescription };
};

export const checkActionResult = <T>(
	{ error, data }: { error?: { message?: string }; data?: T },
	{
		title,
		getDescription,
	}: {
		title: string;
		getDescription: (data: T) => string;
	},
): FormResult => {
	if (error?.message) {
		return { success: false, message: error.message };
	}

	if (data) {
		return {
			success: true,
			title,
			description: getDescription(data),
		};
	}

	return;
};
