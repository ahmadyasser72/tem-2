import { defineMiddleware } from "astro:middleware";
import { z } from "astro/zod";

export const onRequest = defineMiddleware(
	async ({ locals, url, session, redirect }, next) => {
		locals.parseQuery = (schema) => {
			const querySchema = z
				.instanceof(URLSearchParams)
				.transform((searchParams) =>
					[...searchParams.entries()].reduce<Record<string, string | string[]>>(
						(acc, [key, value]) => {
							if (!value) return acc;

							if (!(key in acc)) acc[key] = value;
							else if (Array.isArray(acc[key])) acc[key].push(value);
							else acc[key] = [acc[key], value];

							return acc;
						},
						{},
					),
				)
				.transform((query) => {
					for (const [key, value] of Object.entries(query)) {
						if (value === "reset" || value.includes("reset")) delete query[key];
					}

					return query;
				});

			const query = querySchema.parse(url.searchParams);
			return schema.parse(query);
		};

		if (url.pathname.startsWith("/dashboard")) {
			const user = await session?.get("user");
			if (!user) return redirect(new URL("/login", url).pathname);

			locals.user = user;
		}

		return next();
	},
);
