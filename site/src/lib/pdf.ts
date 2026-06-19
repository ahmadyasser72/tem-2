import fs from "node:fs";

import type { APIRoute } from "astro";
import { CHROMIUM_PATH } from "astro:env/server";
import type { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-core";

interface GeneratePdfOptions {
	url: string;
}

// ── Browser singleton ──────────────────────────────────────────────────────

let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

// Persist across HMR via hot.data agar pending launch .then() tetap ter-track
let allBrowsers: Set<Browser>;
if (import.meta.hot) {
	if (!import.meta.hot.data.allBrowsers)
		import.meta.hot.data.allBrowsers = new Set();
	allBrowsers = import.meta.hot.data.allBrowsers;
} else {
	allBrowsers = new Set();
}

async function getBrowser(): Promise<Browser> {
	if (browserInstance?.connected) return browserInstance;
	if (browserPromise) return browserPromise;

	const chromiumPath = CHROMIUM_PATH;
	if (!fs.existsSync(chromiumPath))
		throw new Error(`Chromium not found at ${chromiumPath}`);

	browserPromise = puppeteer
		.launch({
			executablePath: chromiumPath,
			args: ["--no-sandbox", "--headless=new"],
		})
		.then((b) => {
			browserInstance = b;
			allBrowsers.add(b);
			b.on("disconnected", () => {
				browserInstance = null;
				browserPromise = null;
				allBrowsers.delete(b);
			});
			return b;
		});

	return await browserPromise;
}

// ── HMR cleanup — close all browsers before module reload ──────────────────

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		browserPromise = null;
		browserInstance = null;
		for (const b of allBrowsers) {
			b.close().catch(() => {});
		}
		allBrowsers.clear();
	});
}

// ── Shared auth token for puppeteer ────────────────────────────────────────

let pdfToken: string | null = null;

export function getPDFToken(): string {
	// Dev: HMR resets modules constantly, pakai token tetap biar middleware cocok
	if (import.meta.env.DEV) return "dev-pdf-token";

	if (!pdfToken) {
		// 48-char hex — practically unguessable
		const bytes = new Uint8Array(24);
		crypto.getRandomValues(bytes);
		pdfToken = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
			"",
		);
	}
	return pdfToken;
}

// ── Generate PDF ───────────────────────────────────────────────────────────

export async function generatePDF(opts: GeneratePdfOptions): Promise<Buffer> {
	const { url } = opts;

	const browser = await getBrowser();
	const page = await browser.newPage();

	try {
		await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			preferCSSPageSize: true,
		});

		return Buffer.from(pdf);
	} finally {
		await page.close();
	}
}

// ── Reusable download handler ──────────────────────────────────────────────

type PathResolver = string | ((reqUrl: URL) => string);
type FilenameResolver = string | ((reqUrl: URL) => string);

export function makeDownloadHandler(
	path: PathResolver,
	filename: FilenameResolver = "laporan",
): APIRoute {
	return async ({ url: reqUrl, locals }) => {
		const search = reqUrl.searchParams;
		const baseName =
			typeof filename === "function" ? filename(reqUrl) : filename;
		const dateStr = new Date().toISOString().slice(0, 10);
		const safeName = `${baseName}_${dateStr}`.replace(/[^a-zA-Z0-9_\-]/g, "_");
		const createdBy = locals.user?.name ?? "Staff";

		// Pass auth token + user info to the target page
		search.set("_pdf_token", getPDFToken());
		search.set("createdBy", createdBy);

		const renderPath = typeof path === "function" ? path(reqUrl) : path;
		const pageUrl = `${reqUrl.origin}${renderPath}?${search.toString()}`;

		const pdfBuffer = await generatePDF({ url: pageUrl });

		return new Response(pdfBuffer as unknown as BodyInit, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${safeName}.pdf"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	};
}
