import { randomUUID } from "node:crypto";
import { hashPassword } from "@indekos/utilities/password";

import { db, eq } from "./index";
import { rooms, USER_ROLES, users } from "./schema";

const ROOM_SEED = [
	...Array.from({ length: 6 }, (_, i) => ({
		roomNumber: `A${i + 1}`,
		roomType: "standard" as const,
		monthlyPrice: 500000,
	})),
	...Array.from({ length: 6 }, (_, i) => ({
		roomNumber: `B${i + 1}`,
		roomType: "premium" as const,
		monthlyPrice: 600000,
	})),
];

const ensureUser = async (
	username: string,
	displayName: string,
	role: (typeof USER_ROLES)[number],
	passwordOverride?: string,
) => {
	const existing = await db.query.users.findFirst({
		where: { username },
	});

	const password = passwordOverride ?? randomUUID();
	const passwordHash = await hashPassword(password);

	if (existing) {
		if (!passwordOverride) {
			console.log(
				"User '%s' already exists (id=%d), skipping",
				username,
				existing.id,
			);

			return;
		}

		await db
			.update(users)
			.set({ passwordHash })
			.where(eq(users.id, existing.id));

		console.log("User '%s' password updated (id=%d)", username, existing.id);

		return;
	}

	const [user] = await db
		.insert(users)
		.values({ username, passwordHash, displayName, role })
		.returning({ id: users.id });

	console.log("User '%s' created (id=%d)", username, user.id);
};

export const seedRooms = async () => {
	const existing = await db.query.rooms.findFirst();

	if (existing) {
		console.log("Rooms already seeded, skipping");
		return;
	}

	const inserted = await db.insert(rooms).values(ROOM_SEED).returning();

	console.log("Seeded %d rooms", inserted.length);
};

export const seedUsers = async () => {
	await ensureUser("owner", "Muna Nada Ardhana", "owner", "owner1");
	await ensureUser("staff", "Staff", "staff", "staff1");
};

const main = async () => {
	await seedRooms();
	await seedUsers();
};

main();
