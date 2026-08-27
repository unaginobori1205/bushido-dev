/**
 * Working memory (docs/ARCHITECTURE.md §8): the current conversation only,
 * in-process, cleared when the conversation ends. Feeds core/context's
 * per-turn context assembly.
 */

export type TurnRole = "user" | "assistant";

export interface Turn {
  role: TurnRole;
  text: string;
  /** ms since epoch; passed in by the caller (see repo-wide Date.now() note) rather than read here. */
  at: number;
}

export interface WorkingMemoryOptions {
  /** Max turns kept before the oldest are dropped. Keeps prompts bounded for a long-running session. */
  maxTurns?: number;
}

export class WorkingMemory {
  private turns: Turn[] = [];
  private readonly maxTurns: number;

  constructor(opts: WorkingMemoryOptions = {}) {
    this.maxTurns = opts.maxTurns ?? 40;
  }

  push(turn: Turn): void {
    this.turns.push(turn);
    if (this.turns.length > this.maxTurns) {
      this.turns.splice(0, this.turns.length - this.maxTurns);
    }
  }

  /** All turns, oldest first — ready to splice into a prompt/context window. */
  getTurns(): readonly Turn[] {
    return this.turns;
  }

  /** Plain-text transcript, one line per turn, useful for a daily-memory summary prompt. */
  toTranscript(): string {
    return this.turns.map((t) => `${t.role === "user" ? "User" : "SHOGUN"}: ${t.text}`).join("\n");
  }

  clear(): void {
    this.turns = [];
  }

  get length(): number {
    return this.turns.length;
  }
}
