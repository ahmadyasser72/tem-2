#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync } from "fs";
import { dirname, join, relative } from "path";

import { chromium } from "playwright";

const root = process.cwd();
const src = join(root, "docs/wireframe-v2");
const out = join(root, "docs/wireframe-v2/png");

const htmlFiles = [];
for (const dir of ["input", "output"]) {
	const dirPath = join(src, dir);
	if (!existsSync(dirPath)) continue;
	for (const f of readdirSync(dirPath)) {
		if (f.endsWith(".html")) htmlFiles.push(join(dirPath, f));
	}
}

let ok = 0,
	fail = 0;
const browser = await chromium.launch();

try {
	for (const file of htmlFiles) {
		const rel = relative(src, file).replace(/\.html$/, ".png");
		const outPath = join(out, rel);
		mkdirSync(dirname(outPath), { recursive: true });

		const ctx = await browser.newContext({ deviceScaleFactor: 2 });
		const page = await ctx.newPage();
		try {
			await page.goto("file://" + file, { waitUntil: "networkidle" });

			const name = file.toLowerCase();
			let el;
			if (name.includes("laporan")) el = page.locator(".report-paper").first();
			else if (name.includes("invoice"))
				el = page.locator(".invoice-card").first();
			else if (name.includes("login"))
				el = page.locator("body > .card").first();
			else el = page.locator(".max-w-6xl").first();

			if (!(await el.count())) {
				console.error("✗ no match:", rel);
				fail++;
				continue;
			}
			await el.screenshot({ path: outPath });
			console.log("✓", rel);
			ok++;
		} finally {
			await ctx.close();
		}
	}
} finally {
	await browser.close();
}

console.log(`\nDone — ${ok} OK, ${fail} fail → ${out}/`);
