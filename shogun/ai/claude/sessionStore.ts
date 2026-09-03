/**
 * Remembers which Claude Code session belongs to which working directory,
 * so "continue yesterday's work" actually resumes the same conversation
 * (`claude --resume <id>`) instead of starting cold every time.
 *
 * Keyed by absolute cwd rather than a single global id: Claude Code's own
 * session history is per-project, so reusing one project's session id in
 * another directory would resume the wrong conversation.
 *
 * Pure enough to unit test — the only I/O is reading/writing one JSON file,
 * and both are tolerant of it being missing or corrupt (a lost session id
 * costs continuity, not correctness, so it must never crash the assistant).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type SessionMap = Record<string, string>;

export function parseSessionMap(raw: string): SessionMap {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: SessionMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value) out[key] = value;
    }
    return out;
  } catch {
    return {}; // corrupt file — start fresh rather than refusing to run
  }
}

export class SessionStore {
  constructor(private readonly filePath: string) {}

  private read(): SessionMap {
    try {
      return parseSessionMap(readFileSync(this.filePath, "utf8"));
    } catch {
      return {}; // no file yet
    }
  }

  get(cwd: string): string | undefined {
    return this.read()[cwd];
  }

  set(cwd: string, sessionId: string): void {
    const map = this.read();
    map[cwd] = sessionId;
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  }

  clear(cwd: string): void {
    const map = this.read();
    delete map[cwd];
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  }
}
