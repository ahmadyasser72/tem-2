import type { Tenant } from "@indekos/database/schema";

export interface ConversationSession {
	jid: string;
	tenant: Tenant;
	flow: string;
	step: string;
	lastActivity: number;
	data: Record<string, unknown>;
}

export interface StepResult {
	reply: string;
	/** null = end session, undefined = stay on same step (retry/error), string = next step id */
	next?: string | null;
}

export type StepHandler = (
	input: string,
	session: ConversationSession,
) => StepResult | Promise<StepResult>;

export interface FlowDef {
	name: string;
	initialStep: string;
	steps: Record<string, StepHandler>;
}
