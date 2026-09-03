/**
 * core/intent-router — decides when a spoken turn is a *task to execute*
 * rather than just conversation.
 *
 * Rather than pattern-matching Japanese phrasing ourselves, this hands the
 * decision to the model that is already listening: `ai/openai` registers
 * the `delegate_to_claude_code` function below on the Realtime session, and
 * the model calls it when the user asks for actual work. That gets us
 * natural phrasing coverage for free, and — importantly for the UX the
 * reference walkthrough describes (docs/IMPLEMENTATION_PLAN.md §10) — lets
 * the assistant *speak* its acknowledgement and ETA in the same turn it
 * decides to delegate.
 *
 * The model proposes; `core/permissions` disposes. A tool call is a request
 * to act, never permission to act.
 */
import { PermissionLevel, type PendingAction } from "../permissions/index.js";

export const DELEGATE_TOOL_NAME = "delegate_to_claude_code";

/** Function definition sent in `session.update`'s `tools` array. */
export const DELEGATE_TOOL_DEFINITION = {
  type: "function" as const,
  name: DELEGATE_TOOL_NAME,
  description:
    "Hand a concrete task to Claude Code to run on the user's computer: reading or analysing files, writing code, " +
    "generating documents/spreadsheets/slides, running scripts, git operations. Use this only for real work on the " +
    "machine — answer questions, chat, and recall from memory yourself without calling this. Before calling it, tell " +
    "the user out loud that you are starting and roughly how long you expect it to take.",
  parameters: {
    type: "object",
    properties: {
      instruction: {
        type: "string",
        description:
          "The task, rewritten as a complete self-contained instruction for Claude Code, in the user's own language. " +
          "Include everything Claude Code needs: which files/folders, the desired output and where to save it.",
      },
      estimate: {
        type: "string",
        description: "Your rough time estimate as spoken to the user, e.g. '2〜3分' or 'about a minute'.",
      },
      confirmed: {
        type: "boolean",
        description:
          "Set false (or omit) the first time you propose a task. You will be told to confirm with the user; " +
          "once the user has actually said yes out loud, call again with confirmed: true and the same instruction. " +
          "Never set true without the user having just agreed.",
      },
    },
    required: ["instruction"],
    additionalProperties: false,
  },
};

export interface DelegateIntent {
  kind: "delegate_to_claude_code";
  callId: string;
  instruction: string;
  estimate?: string;
  /** The model's claim that the user just agreed out loud — never trusted on its own; see server.ts. */
  confirmed: boolean;
}

/**
 * Parses the `arguments` JSON string from a Realtime function call.
 * Returns null for anything malformed — a garbled tool call should be
 * ignored, not guessed at, since acting on a misread instruction is
 * exactly the failure mode the permission model exists to prevent.
 */
export function parseDelegateIntent(callId: string, name: string, argumentsJson: string): DelegateIntent | null {
  if (name !== DELEGATE_TOOL_NAME || !callId) return null;
  try {
    const parsed = JSON.parse(argumentsJson) as Record<string, unknown>;
    const instruction = typeof parsed.instruction === "string" ? parsed.instruction.trim() : "";
    if (!instruction) return null;
    const estimate = typeof parsed.estimate === "string" && parsed.estimate.trim() ? parsed.estimate.trim() : undefined;
    return { kind: "delegate_to_claude_code", callId, instruction, estimate, confirmed: parsed.confirmed === true };
  } catch {
    return null;
  }
}

/**
 * Delegated work runs commands and writes files on the user's machine, so
 * it is Level 2 (CONFIRM) by default — see docs/ARCHITECTURE.md §5. The
 * orchestrator is what decides whether the user's standing configuration
 * already satisfies that confirmation (an explicitly loosened
 * CLAUDE_EXTRA_ARGS in a sandbox directory) or whether it has to ask.
 */
export function toPendingAction(intent: DelegateIntent): PendingAction {
  return {
    id: intent.callId,
    level: PermissionLevel.CONFIRM,
    description: `Claude Codeに実行を依頼: ${intent.instruction}`,
  };
}
