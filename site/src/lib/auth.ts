import { createHash } from "node:crypto";

export const hashPassword = (password: string) =>
	createHash("sha512").update(password).digest("hex");

export const ROLES = ["admin", "staff", "owner"] as const;
