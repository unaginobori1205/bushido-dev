/**
 * Daily memory (spec §8 / §9 / §10 / docs/ARCHITECTURE.md §8): one record
 * per day, written on session end ("今日は終わり"/"おやすみ") and read on
 * the next launch to answer "前回何してた？".
 */
import type { ShogunDatabase } from "../../database/db.js";

export interface DailyMemoryRecord {
  date: string; // YYYY-MM-DD
  projects: string[];
  decisions: string[];
  completedTasks: string[];
  unfinishedTasks: string[];
  importantPeople: string[];
  notes: string[];
  updatedAt: number;
}

function emptyRecord(date: string, updatedAt: number): DailyMemoryRecord {
  return {
    date,
    projects: [],
    decisions: [],
    completedTasks: [],
    unfinishedTasks: [],
    importantPeople: [],
    notes: [],
    updatedAt,
  };
}

function rowToRecord(row: Record<string, unknown>): DailyMemoryRecord {
  return {
    date: row.date as string,
    projects: JSON.parse(row.projects as string),
    decisions: JSON.parse(row.decisions as string),
    completedTasks: JSON.parse(row.completed_tasks as string),
    unfinishedTasks: JSON.parse(row.unfinished_tasks as string),
    importantPeople: JSON.parse(row.important_people as string),
    notes: JSON.parse(row.notes as string),
    updatedAt: row.updated_at as number,
  };
}

export class DailyMemory {
  constructor(private readonly db: ShogunDatabase) {}

  get(date: string): DailyMemoryRecord | null {
    const row = this.db.prepare(`SELECT * FROM daily_memory WHERE date = ?`).get(date) as
      | Record<string, unknown>
      | undefined;
    return row ? rowToRecord(row) : null;
  }

  /**
   * Most recently updated record that is *not* `excludeDate` (normally
   * today) — this is what answers "前回何してた？" on a fresh launch,
   * before today has any record of its own yet.
   */
  getLatestBefore(excludeDate: string): DailyMemoryRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM daily_memory WHERE date != ? ORDER BY date DESC LIMIT 1`)
      .get(excludeDate) as Record<string, unknown> | undefined;
    return row ? rowToRecord(row) : null;
  }

  /** Creates today's record if missing, merges in `patch`, and persists it. Returns the resulting record. */
  upsert(date: string, patch: Partial<Omit<DailyMemoryRecord, "date" | "updatedAt">>, now: number): DailyMemoryRecord {
    const current = this.get(date) ?? emptyRecord(date, now);
    const merged: DailyMemoryRecord = {
      ...current,
      ...patch,
      date,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO daily_memory (date, projects, decisions, completed_tasks, unfinished_tasks, important_people, notes, updated_at)
         VALUES (@date, @projects, @decisions, @completedTasks, @unfinishedTasks, @importantPeople, @notes, @updatedAt)
         ON CONFLICT(date) DO UPDATE SET
           projects=excluded.projects,
           decisions=excluded.decisions,
           completed_tasks=excluded.completed_tasks,
           unfinished_tasks=excluded.unfinished_tasks,
           important_people=excluded.important_people,
           notes=excluded.notes,
           updated_at=excluded.updated_at`,
      )
      .run({
        date: merged.date,
        projects: JSON.stringify(merged.projects),
        decisions: JSON.stringify(merged.decisions),
        completedTasks: JSON.stringify(merged.completedTasks),
        unfinishedTasks: JSON.stringify(merged.unfinishedTasks),
        importantPeople: JSON.stringify(merged.importantPeople),
        notes: JSON.stringify(merged.notes),
        updatedAt: merged.updatedAt,
      });
    return merged;
  }

  /** Appends one note (e.g. a rolling session summary) rather than overwriting the whole notes array. */
  appendNote(date: string, note: string, now: number): DailyMemoryRecord {
    const current = this.get(date) ?? emptyRecord(date, now);
    return this.upsert(date, { notes: [...current.notes, note] }, now);
  }
}

/**
 * Renders a short recap of a daily record for splicing into the system
 * context so "前回何してた？" is answerable without a separate summarizer
 * call — see docs/IMPLEMENTATION_PLAN.md §6 item 8.
 */
export function summarizeDailyRecord(record: DailyMemoryRecord | null): string {
  if (!record) return "前回のセッション記録はまだありません。";
  const lines = [`${record.date} の記録:`];
  if (record.notes.length) lines.push(`メモ: ${record.notes.join(" / ")}`);
  if (record.completedTasks.length) lines.push(`完了: ${record.completedTasks.join(", ")}`);
  if (record.unfinishedTasks.length) lines.push(`未完了: ${record.unfinishedTasks.join(", ")}`);
  if (record.decisions.length) lines.push(`決定事項: ${record.decisions.join(", ")}`);
  if (lines.length === 1) lines.push("(詳細な記録なし)");
  return lines.join("\n");
}
