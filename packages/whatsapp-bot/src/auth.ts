import { db, eq } from "@e-kos/database";
import { botAuth } from "@e-kos/database/schema";

import { BufferJSON, initAuthCreds, proto } from "baileys";
import type { AuthenticationState, SignalDataTypeMap } from "baileys";

function fixKey(key: string) {
	return key.replace(/\//g, "__").replace(/:/g, "-");
}

export async function useSqliteAuthState(): Promise<{
	state: AuthenticationState;
	saveCreds: () => Promise<void>;
}> {
	const credRow = await db.query.botAuth.findFirst({
		where: { key: "creds" },
	});

	const creds = credRow
		? JSON.parse(credRow.value, BufferJSON.reviver)
		: initAuthCreds();

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const data: any = {};
					await Promise.all(
						ids.map(async (id) => {
							const row = await db.query.botAuth.findFirst({
								where: { key: fixKey(`${type}-${id}`) },
							});
							if (row) {
								let value = JSON.parse(row.value, BufferJSON.reviver);
								if (type === "app-state-sync-key" && value) {
									value = proto.Message.AppStateSyncKeyData.fromObject(value);
								}
								data[id] = value;
							}
						}),
					);
					return data;
				},
				set: async (data) => {
					const tasks: Promise<void>[] = [];
					for (const category in data) {
						for (const id in data[category as keyof SignalDataTypeMap]) {
							const value = data[category as keyof SignalDataTypeMap]![id];
							const key = fixKey(`${category}-${id}`);
							if (value) {
								tasks.push(
									db
										.insert(botAuth)
										.values({
											key,
											value: JSON.stringify(value, BufferJSON.replacer),
										})
										.onConflictDoUpdate({
											target: botAuth.key,
											set: {
												value: JSON.stringify(value, BufferJSON.replacer),
											},
										})
										.then(() => {}),
								);
							} else {
								tasks.push(
									db
										.delete(botAuth)
										.where(eq(botAuth.key, key))
										.then(() => {}),
								);
							}
						}
					}
					await Promise.all(tasks);
				},
			},
		},
		saveCreds: async () => {
			await db
				.insert(botAuth)
				.values({
					key: "creds",
					value: JSON.stringify(creds, BufferJSON.replacer),
				})
				.onConflictDoUpdate({
					target: botAuth.key,
					set: { value: JSON.stringify(creds, BufferJSON.replacer) },
				});
		},
	};
}
