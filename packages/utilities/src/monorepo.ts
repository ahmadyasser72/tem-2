import { workspaceRootSync } from "workspace-root";

export const MONOREPO_ROOT = (() => {
	const monorepoRoot = workspaceRootSync() ?? process.env.MONOREPO_ROOT;
	if (!monorepoRoot) throw new Error("couldn't determine MONOREPO_ROOT.");
	return monorepoRoot;
})();
