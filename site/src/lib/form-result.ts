import type { ActionClient } from "astro:actions";

export type FormResult =
	| { success: false; message: string }
	| { success: true; title: string; description: string }
	| void;

type ActionClientOutput<T extends ActionClient<any, any, any>> =
	T extends ActionClient<infer TOutput, any, any> ? Awaited<TOutput> : never;

export function createActionResult<TAction extends ActionClient<any, any, any>>(
	action: TAction,
	title: string,
	getDescription: (data: ActionClientOutput<TAction>) => string,
) {
	return { action, title, getDescription };
}

export function checkActionResult<T>(
	result: { error?: { message?: string }; data?: T },
	successConfig: {
		title: string;
		getDescription: (data: T) => string;
	},
): FormResult {
	if (result.error?.message) {
		return { success: false, message: result.error.message };
	}

	if (result.data) {
		return {
			success: true,
			title: successConfig.title,
			description: successConfig.getDescription(result.data),
		};
	}

	return;
}
