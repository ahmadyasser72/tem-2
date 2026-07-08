import { db, inArray } from "@indekos/database";
import {
	pushHistory,
	pushSubscriptions,
	type PushData,
	type User,
} from "@indekos/database/schema";

import { groupBy } from "es-toolkit";
import webpush from "web-push";

import dayjs from "./date";

export const sendPush = async (
	to: (Pick<User, "id"> | string)[],
	data: PushData,
) => {
	if (to.length === 0) return;

	const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
	if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)
		throw new Error("VAPID_* is not set");

	const users = [] as number[];
	const endpoints = [] as string[];
	for (const target of to) {
		if (typeof target === "string") endpoints.push(target);
		else users.push(target.id);
	}

	const subscriptions = await db.query.pushSubscriptions.findMany({
		where: {
			OR: [
				{
					user: {
						id: { in: users },
						lastAccessed: {
							gte: dayjs().startOf("day").subtract(1, "day").toDate(),
						},
					},
				},
				{ endpoint: { in: endpoints } },
			],
		},
	});
	if (subscriptions.length === 0) return;

	const results = await Promise.allSettled(
		subscriptions.map((sub) =>
			webpush.sendNotification(
				{
					endpoint: sub.endpoint,
					keys: { auth: sub.authKey, p256dh: sub.p256dhKey },
				},
				JSON.stringify(data),
				{
					vapidDetails: {
						privateKey: VAPID_PRIVATE_KEY,
						publicKey: VAPID_PUBLIC_KEY,
						subject: VAPID_SUBJECT,
					},
				},
			),
		),
	);

	// Clean up expired subscriptions (HTTP 404/410)
	const grouped = groupBy([...results.entries()], ([, promise]) => {
		if (promise.status === "rejected") return "failed";

		const status = promise.value.statusCode;
		return status === 404 || status === 410 ? "invalid" : "sent";
	});

	if (grouped.invalid?.length > 0)
		await db.delete(pushSubscriptions).where(
			inArray(
				pushSubscriptions.endpoint,
				grouped.invalid.map(([idx]) => subscriptions[idx].endpoint),
			),
		);
	if (grouped.sent?.length > 0)
		await db.insert(pushHistory).values(
			grouped.sent.map(([idx]) => ({
				endpoint: subscriptions[idx].endpoint,
				data,
			})),
		);
};
