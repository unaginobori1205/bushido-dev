/**
 * Action Log (spec §23 / docs/SECURITY.md): every tool execution SHOGUN
 * performs, for traceability. MVP0.1 only ever logs plain conversation
 * turns (intent="conversation", tool=null) since it has no side-effecting
 * intents yet — but the table and API exist now so MVP0.2+ doesn't have to
 * retrofit logging onto code that didn't expect it.
 *
 * Caller is responsible for redacting `parameters` before calling
 * `logAction` — this module does not attempt to guess what looks like a
 * secret (see docs/SECURITY.md's explicit warning about that).
 */
import type { ShogunDatabase } from "./db.js";

export interface ActionLogEntry {
  timestamp: number;
  userRequest: string;
  intent?: string | null;
  tool?: string | null;
  parameters?: unknown;
  permissionLevel?: number | null;
  confirmation?: string | null;
  result?: string | null;
}

export function logAction(db: ShogunDatabase, entry: ActionLogEntry): void {
  db.prepare(
    `INSERT INTO action_log
      (timestamp, user_request, intent, tool, parameters, permission_level, confirmation, result)
     VALUES (@timestamp, @userRequest, @intent, @tool, @parameters, @permissionLevel, @confirmation, @result)`,
  ).run({
    timestamp: entry.timestamp,
    userRequest: entry.userRequest,
    intent: entry.intent ?? null,
    tool: entry.tool ?? null,
    parameters: entry.parameters !== undefined ? JSON.stringify(entry.parameters) : null,
    permissionLevel: entry.permissionLevel ?? null,
    confirmation: entry.confirmation ?? null,
    result: entry.result ?? null,
  });
}

export function listRecentActions(db: ShogunDatabase, limit = 50): ActionLogEntry[] {
  const rows = db
    .prepare(`SELECT * FROM action_log ORDER BY timestamp DESC LIMIT ?`)
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    timestamp: r.timestamp as number,
    userRequest: r.user_request as string,
    intent: r.intent as string | null,
    tool: r.tool as string | null,
    parameters: r.parameters ? JSON.parse(r.parameters as string) : null,
    permissionLevel: r.permission_level as number | null,
    confirmation: r.confirmation as string | null,
    result: r.result as string | null,
  }));
}
