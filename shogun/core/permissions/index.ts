/**
 * The single chokepoint for SHOGUN's ASK BEFORE ACT rule (see
 * docs/ARCHITECTURE.md §5, docs/SECURITY.md). Every code path that would
 * have an external side effect must call `assertPermission` (or, for
 * Level 2/3, `requestConfirmation`) here — never re-implement a
 * confirmation check inside an individual integration.
 *
 * MVP0.1 has no Level 1+ intents (it's a plain conversation loop), so
 * nothing calls this yet. It exists now so MVP0.2 doesn't have to
 * retrofit a permission system onto code that was written assuming
 * everything is safe to just run.
 */

export enum PermissionLevel {
  /** Auto-run. No side effects: read calendar, read files, search mail, git status. */
  READ = 0,
  /** Auto-run. Produces a draft that is NOT yet sent/applied: email draft, proposal text, code diff. */
  PREPARE = 1,
  /** Requires an explicit "yes" in the same session before executing: send email, create event, git commit, MCP write. */
  CONFIRM = 2,
  /** Requires a *specific* confirmation that restates the action: delete file, git push, prod change, payment, bulk email. */
  CRITICAL = 3,
}

export interface PendingAction {
  /** Human-readable description of what will happen, read back to the user for Level 3. */
  description: string;
  level: PermissionLevel;
  /** Opaque id the orchestrator uses to match a later "yes"/"no" reply back to this action. */
  id: string;
}

export class PermissionDeniedError extends Error {
  constructor(public readonly action: PendingAction) {
    super(`Action requires confirmation before it can run: ${action.description}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Level 0/1 actions are allowed to proceed immediately — there is nothing
 * to confirm. This function exists mainly so call sites are explicit about
 * *which* level they believe they're at, rather than skipping the check
 * silently.
 */
export function assertAutoRunnable(action: PendingAction): void {
  if (action.level >= PermissionLevel.CONFIRM) {
    throw new PermissionDeniedError(action);
  }
}

/**
 * Level 2/3 actions must go through the orchestrator's CONFIRMING state
 * (docs/ARCHITECTURE.md §5) rather than executing directly. This helper
 * just centralizes the level check; the orchestrator owns actually asking
 * the user and correlating their reply back to `action.id`.
 */
export function requiresConfirmation(action: PendingAction): boolean {
  return action.level >= PermissionLevel.CONFIRM;
}

/**
 * Level 3 requires the confirmation to restate the action, not just accept
 * a bare "はい"/"yes" — see docs/ARCHITECTURE.md §5. This is a naive
 * heuristic (minimum reply length) good enough to stop an accidental short
 * "yes" from applying to a stale CRITICAL action; real intent-based
 * confirmation matching belongs to core/intent-router once it exists.
 */
export function isSufficientCriticalConfirmation(action: PendingAction, userReply: string): boolean {
  if (action.level < PermissionLevel.CRITICAL) return true;
  const trimmed = userReply.trim();
  return trimmed.length >= 4 && !/^(はい|yes|ok|うん)$/i.test(trimmed);
}
