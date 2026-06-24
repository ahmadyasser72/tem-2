import { db } from "@e-kos/database";
import {
	AUDIT_ACTIONS,
	auditLogs,
	type AuditDetails,
} from "@e-kos/database/schema";

type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const logAudit = async (
	dbInstance: typeof db,
	userId: number | null,
	action: AuditAction,
	tableName: string,
	recordId: number | null,
	details: AuditDetails,
): Promise<void> => {
	await dbInstance.insert(auditLogs).values({
		userId,
		action,
		tableName,
		recordId,
		details,
	});
};
