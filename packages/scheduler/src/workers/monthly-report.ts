import { db } from "@indekos/database";
import { auditDetail, auditLogs, type User } from "@indekos/database/schema";
import dayjs, { formatDate } from "@indekos/utilities/date";
import { sendPush } from "@indekos/utilities/push";
import { formatCurrency } from "@indekos/utilities/transforms";

import { groupBy, sumBy } from "es-toolkit";

import { logger } from "../index";

export const runMonthlyReport = async (systemUser: User, now?: Date) => {
	const ref = now ?? new Date();
	const startDate = dayjs(ref).subtract(1, "month").startOf("month").toDate();
	const endDate = dayjs(ref).subtract(1, "month").endOf("month").toDate();

	const invoices = await db.query.invoices.findMany({
		where: { dueDate: { gte: startDate, lte: endDate } },
	});

	const { paid, unpaid } = groupBy(invoices, ({ status }) =>
		status === "paid" ? "paid" : "unpaid",
	);
	const paidTotal = sumBy(paid, ({ amount }) => amount);
	const unpaidTotal = sumBy(unpaid, ({ amount }) => amount);

	const users = await db.query.users.findMany({
		where: { role: { in: ["staff", "owner"] } },
	});

	await sendPush(users, {
		title: `Laporan Keuangan ${formatDate(startDate, "MMMM YYYY")}`,
		body: `Terbayar: ${formatCurrency(paidTotal)} | Tertunggak: ${formatCurrency(unpaidTotal)}`,
		url: "/dashboard/report/transactions",
	});

	await db.insert(auditLogs).values({
		userId: systemUser.id,
		action: "CREATE",
		tableName: "notifications",
		details: auditDetail.notification(
			`Monthly report: ${paid.length} paid, ${unpaid.length} unpaid`,
			"push",
		),
	});

	logger.info(
		{
			month: formatDate(startDate, "YYYY-MM"),
			paid: paid.length,
			unpaid: unpaid.length,
		},
		"Monthly report push sent",
	);
};
