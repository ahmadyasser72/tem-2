declare namespace App {
	interface SessionData {
		user: {
			id: number;
			name: string;
			role: "admin" | "staff" | "owner";
		};
	}

	interface Locals {
		parseQuery: <S extends import("astro/zod").ZodType>(
			schema: S,
		) => import("astro/zod").output<S>;
		user?: SessionData["user"];
	}
}
