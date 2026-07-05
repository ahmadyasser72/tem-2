declare global {
	var showClientSideToast: (
		type: "info" | "error",
		title: string,
		description?: string,
	) => void;
}

export {};
