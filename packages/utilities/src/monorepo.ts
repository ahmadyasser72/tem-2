import { workspaceRootSync } from "workspace-root";

export const MONOREPO_ROOT = workspaceRootSync()!;
if (!MONOREPO_ROOT) throw new Error("couldn't determine MONOREPO_ROOT.");
