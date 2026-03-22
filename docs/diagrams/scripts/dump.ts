import path from "node:path";
import { DIAGRAM_FOLDER, getDiagrams } from "./shared";

const readDiagrams = async (pattern: string, type: string) =>
  Promise.all(
    getDiagrams(pattern).map(async (file) => {
      const content = await Bun.file(file).text();
      return [
        `## ${path.basename(file)}`,
        "",
        "```" + type,
        content,
        "```",
      ].join("\n");
    }),
  );

console.time("read diagrams");
console.time("read activity diagrams");
const activityDiagrams = [
  ...(await readDiagrams("*_activity_diagram_*.pu", "plantuml")),
  ...(await readDiagrams("*_activity_diagram_*.mmd", "mermaid")),
];
console.timeEnd("read activity diagrams");

console.time("read sequence diagrams");
const sequenceDiagrams = [
  ...(await readDiagrams("*_sequence_diagram_*.pu", "plantuml")),
  ...(await readDiagrams("*_sequence_diagram_*.mmd", "mermaid")),
];
console.timeEnd("read sequence diagrams");
console.timeEnd("read diagrams");

console.time("dump diagrams");
console.time("dump activity diagrams");
await Bun.write(
  path.join(DIAGRAM_FOLDER, ".dump_activity_diagrams.md"),
  activityDiagrams.join("\n\n"),
);
console.timeEnd("dump activity diagrams");

console.time("dump sequence diagrams");
await Bun.write(
  path.join(DIAGRAM_FOLDER, ".dump_sequence_diagrams.md"),
  sequenceDiagrams.join("\n\n"),
);
console.timeEnd("dump sequence diagrams");
console.timeEnd("dump diagrams");
