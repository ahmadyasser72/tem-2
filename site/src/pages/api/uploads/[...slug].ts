import path from "node:path";
import { UPLOADS_DIR } from "@indekos/utilities/database";

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
	if (!locals.user) return new Response("Forbidden", { status: 403 });

	const { slug } = params;
	if (!slug) return new Response("Not Found", { status: 404 });

	// Ensure the resolved path stays within the uploads directory.
	const requestedPath = path.resolve(UPLOADS_DIR, slug);
	if (
		requestedPath !== UPLOADS_DIR &&
		!requestedPath.startsWith(UPLOADS_DIR + path.sep)
	) {
		return new Response("Forbidden", { status: 403 });
	}

	const file = Bun.file(requestedPath);
	if (await file.exists()) return new Response(file);
	else return new Response("Not Found", { status: 404 });
};
