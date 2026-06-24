import { db } from "@e-kos/database";

import { defineMiddleware } from "astro:middleware";
import { z } from "astro/zod";

import { logAudit as logAuditHelper } from "~/lib/audit-log";
import { getPDFToken } from "~/lib/pdf";

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

		// Auth guard
		if (
			url.pathname.startsWith("/dashboard") ||
			url.pathname.startsWith("/_actions/manage")
		) {
			// Puppeteer PDF bypass — token dari download.ts, tidak perlu session
			const pdfToken = url.searchParams.get("_pdf_token");
			if (pdfToken && pdfToken === getPDFToken()) {
				locals.user = {
					id: 0,
					name: url.searchParams.get("createdBy") ?? "Staff",
					role: "staff",
				};
				return next();
			}

			const user = await session?.get("user");
			if (!user) {
				console.warn("middleware: unauthenticated access", {
					path: url.pathname,
				});
				return redirect(new URL("/login", url).pathname);
			}

			locals.user = user;
		}

		// Action helpers
		locals.logAudit = (action, tableName, recordId, details) =>
			logAuditHelper(
				db,
				locals.user?.id ?? null,
				action,
				tableName,
				recordId,
				details,
			);

		return next();
	},
);
