import path from "node:path";

export const DOCS_FOLDER = path.join(import.meta.dir, "..");
export const getDiagrams = (pattern: string) =>
	[...new Bun.Glob(pattern).scanSync(DOCS_FOLDER)]
		.map((filename) => path.join(DOCS_FOLDER, filename))
		.sort(naturalSort);

export const naturalSort = (a: string, b: string) =>
	a.localeCompare(b, undefined, { numeric: true });
