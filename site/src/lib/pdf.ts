import fs from "node:fs";

import type { APIRoute } from "astro";
import { CHROMIUM_PATH } from "astro:env/server";
import type { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-core";

let browserInstance: Browser | null = null;
const getBrowser = async () => {
	if (browserInstance?.connected) return browserInstance;

	if (!fs.existsSync(CHROMIUM_PATH))
		throw new Error(`Chromium not found at ${CHROMIUM_PATH}`);

	browserInstance = await puppeteer.launch({
		executablePath: CHROMIUM_PATH,
		args: ["--no-sandbox", "--headless=new"],
	});
	console.log("pdf: browser launched");

	browserInstance.on("disconnected", () => {
		console.log("pdf: browser disconnected");
		browserInstance = null;
	});
	return browserInstance;
};

let pdfToken: string | null = null;
export const getPuppeteerToken = () => {
	// Dev: HMR resets modules constantly, pakai token tetap biar middleware cocok
	if (import.meta.env.DEV) return "dev-pdf-token";

	if (!pdfToken) {
		// 48-char hex — practically unguessable
		const bytes = new Uint8Array(24);
		crypto.getRandomValues(bytes);
		pdfToken = Array.from(bytes, (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");
	}

	return pdfToken;
};

const generatePDF = async (url: string) => {
	const browser = await getBrowser();
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({ "x-puppeteer": getPuppeteerToken() });

	try {
		await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			preferCSSPageSize: true,
		});

		console.log("pdf: generated successfully", { url });
		return Buffer.from(pdf);
	} catch (err) {
		console.error("pdf: generation failed", {
			url,
			error: err instanceof Error ? err.message : err,
		});
		throw err;
	} finally {
		await page.close();
	}
};

export const makeDownloadHandler = (
	path: string | ((url: URL) => string),
	filename: string | ((url: URL) => string) = "laporan",
): APIRoute => {
	return async ({ url, locals }) => {
		const search = url.searchParams;
		search.set("user", locals.user!.id.toString());

		const renderPath = typeof path === "function" ? path(url) : path;
		const pageUrl = `${url.origin}${renderPath}?${search.toString()}`;

		const pdf = await generatePDF(pageUrl);
		const baseName = typeof filename === "function" ? filename(url) : filename;
		const dateStr = new Date().toISOString().slice(0, 10);
		const safeName = `${baseName}_${dateStr}`.replace(/[^a-zA-Z0-9_\-]/g, "_");

		return new Response(pdf, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${safeName}.pdf"`,
				"Content-Length": pdf.length.toString(),
			},
		});
	};
};
