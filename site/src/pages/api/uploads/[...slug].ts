import fs from "node:fs/promises";
import path from "node:path";

import type { APIRoute } from "astro";

const MIME_TYPES: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	gif: "image/gif",
};

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response("Not Found", { status: 404 });
	}

	// Prevent directory traversal
	const safePath = path.normalize(slug).replace(/^(\.\.(\/|\\|$))+/, "");
	if (safePath.includes("..")) {
		return new Response("Forbidden", { status: 403 });
	}

	const baseDir = process.env.UPLOADS_DIR || "./uploads";
	const filePath = path.join(baseDir, safePath);

	try {
		const buffer = await fs.readFile(filePath);
		const ext = path.extname(filePath).replace(".", "").toLowerCase();
		const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

		return new Response(buffer, {
			status: 200,
			headers: { "Content-Type": contentType },
		});
	} catch {
		return new Response("Not Found", { status: 404 });
	}
};
