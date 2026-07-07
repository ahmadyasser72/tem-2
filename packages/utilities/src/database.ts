import path from "path";

import { MONOREPO_ROOT } from "./monorepo";

export const UPLOADS_DIR = path.resolve(
	MONOREPO_ROOT,
	"site",
	process.env.UPLOADS_DIR ?? "uploads",
);
