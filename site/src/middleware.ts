import { db } from "@e-kos/database";

import { getActionContext } from "astro:actions";
import { defineMiddleware } from "astro:middleware";
import { z } from "astro/zod";

import { logAudit } from "~/lib/audit-log";
import { getPuppeteerToken } from "~/lib/pdf";

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.parseQuery = (schema) => {
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

		const query = querySchema.parse(context.url.searchParams);
		return schema.parse(query);
	};

	const { action } = getActionContext(context);
	if (
		context.url.pathname.startsWith("/dashboard") ||
		(action && action.name.startsWith("manage."))
	) {
		const puppeteerToken = context.request.headers.get("x-puppeteer");
		if (puppeteerToken && puppeteerToken === getPuppeteerToken()) {
			const userId = context.url.searchParams.get("user");
			const user = await db.query.users.findFirst({
				columns: { id: true, username: true, displayName: true, role: true },
				where: { id: userId ? Number(userId) : undefined, role: "staff" },
			});

			context.locals.user = {
				id: user?.id ?? 0,
				name: user?.displayName ?? user?.username ?? "Staff",
				role: (user?.role ?? "staff") as App.SessionData["user"]["role"],
			};

			return next();
		}

		const user = await context.session?.get("user");
		if (!user) {
			console.warn("middleware: unauthenticated access", {
				path: context.url.pathname,
			});
			return context.redirect(new URL("/login", context.url).pathname);
		}

		context.locals.user = { ...user, allowEdit: user.role !== "owner" };
	}

	// Action helpers
	context.locals.logAudit = (action, tableName, recordId, details) =>
		logAudit(
			db,
			context.locals.user?.id ?? null,
			action,
			tableName,
			recordId,
			details,
		);

	return next();
});
