import { db, USER_ROLES } from "@e-kos/database";

import { z } from "astro/zod";

import { querySchema, statusSchema } from "~/lib/query";

export const accountsQuerySchema = z.object({
	query: querySchema,
	role: statusSchema(USER_ROLES),
});

export type AccountRow = {
	id: number;
	username: string;
	displayName: string | null;
	lastAccessed: Date | null;
	role: string;
};

export async function fetchAccounts(
	params: z.infer<typeof accountsQuerySchema>,
): Promise<AccountRow[]> {
	const accounts = await db.query.users.findMany({
		columns: {
			id: true,
			username: true,
			displayName: true,
			lastAccessed: true,
			role: true,
		},
		where: {
			role: { ne: "system" },
			...(params.query && {
				OR: [
					{ username: { like: `%${params.query}%` } },
					{ displayName: { like: `%${params.query}%` } },
				],
			}),
			...(params.role && { role: params.role }),
		},
	});
	return accounts;
}
