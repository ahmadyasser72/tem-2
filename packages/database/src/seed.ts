import { createHash, randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";

import { db } from "./index";
import { USER_ROLES, users } from "./schema";

async function promptPassword(label: string): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stderr });
	const password = await rl.question(label);
	rl.close();
	return password;
}

async function ensureUser(
	username: string,
	displayName: string,
	role: (typeof USER_ROLES)[number],
	interactive = false,
) {
	const existing = await db.query.users.findFirst({
		where: { username },
	});

	if (existing) {
		console.log(
			"[Seed] User '%s' already exists (id=%d)",
			username,
			existing.id,
		);
		return existing;
	}

	let password: string;

	if (interactive) {
		password = await promptPassword(`Password for '${username}': `);
		if (!password) {
			console.error("[Seed] Password cannot be empty.");
			process.exit(1);
		}
	} else {
		password = randomUUID();
	}

	const passwordHash = createHash("sha512").update(password).digest("hex");

	const [user] = await db
		.insert(users)
		.values({ username, passwordHash, displayName, role })
		.returning({ id: users.id });

	console.log("[Seed] User '%s' created (id=%d)", username, user.id);
	return user;
}

async function main() {
	await ensureUser("system", "System Scheduler", "system");
	await ensureUser("bot-wa", "WhatsApp Bot", "system");
	await ensureUser("admin", "Administrator", "admin", true);
}

main();
