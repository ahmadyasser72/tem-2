import type { Tenant } from "@indekos/database/schema";

import type { ConversationSession, FlowDef, MessageInput } from "./types";

const SESSION_TIMEOUT_MS = 5 * 60 * 1_000; // 5 menit inactivity
const CLEANUP_INTERVAL_MS = 30 * 1_000; // 30 detik

export class ConversationManager {
	private sessions = new Map<string, ConversationSession>();
	private flows = new Map<string, FlowDef>();
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;

	registerFlow(flow: FlowDef): void {
		this.flows.set(flow.name, flow);
	}

	/** True if JID has active (non-expired) session. */
	hasActiveSession(jid: string): boolean {
		const session = this.sessions.get(jid);
		if (!session) return false;
		if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
			this.endSession(jid);
			return false;
		}
		return true;
	}

	/** Start new session for a JID. */
	startSession(jid: string, tenant: Tenant, flowName: string): void {
		const flow = this.flows.get(flowName);
		if (!flow) throw new Error(`Flow '${flowName}' not registered`);

		this.sessions.set(jid, {
			jid,
			tenant,
			flow: flowName,
			step: flow.initialStep,
			lastActivity: Date.now(),
			data: {},
		});

		if (!this.cleanupTimer) this.startCleanup();
	}

	/**
	 * Route message to active session step handler.
	 * Returns reply string, or null if no active session.
	 */
	async handleMessage(
		jid: string,
		input: MessageInput,
	): Promise<string | null> {
		const session = this.sessions.get(jid);
		if (!session) return null;

		// Expired?
		if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
			this.endSession(jid);
			return null;
		}

		const flow = this.flows.get(session.flow);
		if (!flow) {
			this.endSession(jid);
			return null;
		}

		const step = flow.steps[session.step];
		if (!step) {
			this.endSession(jid);
			return null;
		}

		// Touch activity timestamp
		session.lastActivity = Date.now();

		const result = await step(input, session);

		if (result.next === null) {
			// End session
			this.endSession(jid);
		} else if (result.next !== undefined) {
			// Advance to next step
			session.step = result.next;
		}
		// undefined = stay on same step (retry/error)

		return result.reply;
	}

	/** Force end a session. */
	endSession(jid: string): void {
		this.sessions.delete(jid);
	}

	private startCleanup(): void {
		this.cleanupTimer = setInterval(() => {
			const now = Date.now();
			for (const [jid, session] of this.sessions) {
				if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
					this.sessions.delete(jid);
				}
			}

			if (this.sessions.size === 0) {
				clearInterval(this.cleanupTimer!);
				this.cleanupTimer = null;
			}
		}, CLEANUP_INTERVAL_MS);
	}
}
