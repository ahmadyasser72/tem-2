import path from "node:path";

import { getDiagrams, naturalSort } from "./shared";

const plantUmlDiagrams = getDiagrams("*.pu");
const mermaidJsDiagrams = getDiagrams("*.mmd");

const tasks = [
	...plantUmlDiagrams.map((file) => ({
		file,
		exec: () => Bun.$`bunx plantuml-cli ${file} --png`,
	})),
	...mermaidJsDiagrams.map((file) => ({
		file,
		exec: () =>
			Bun.$`bunx mmdc -i ${file} -o ${file.replace(path.extname(file), "")}.png`,
	})),
].sort((a, b) => naturalSort(a.file, b.file));

console.time("export: all");
for (const { file, exec } of tasks) {
	const id = `export: ${path.basename(file)}`;
	console.time(id);
	await exec().quiet();
	console.timeEnd(id);
}
console.timeEnd("export: all");
