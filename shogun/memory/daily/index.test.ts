import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type ShogunDatabase } from "../../database/db.js";
import { DailyMemory, summarizeDailyRecord } from "./index.js";

describe("DailyMemory", () => {
  let db: ShogunDatabase;
  let mem: DailyMemory;

  beforeEach(() => {
    db = openDatabase(":memory:");
    mem = new DailyMemory(db);
  });

  it("returns null for a date with no record", () => {
    expect(mem.get("2026-08-27")).toBeNull();
  });

  it("upsert creates then merges", () => {
    mem.upsert("2026-08-27", { notes: ["started SHOGUN"] }, 1000);
    const after = mem.upsert("2026-08-27", { completedTasks: ["voice loop"] }, 2000);
    expect(after.notes).toEqual(["started SHOGUN"]);
    expect(after.completedTasks).toEqual(["voice loop"]);
    expect(after.updatedAt).toBe(2000);
  });

  it("getLatestBefore finds yesterday's record, ignoring today", () => {
    mem.upsert("2026-08-26", { notes: ["yesterday work"] }, 1000);
    mem.upsert("2026-08-27", { notes: ["today work"] }, 2000);
    const latest = mem.getLatestBefore("2026-08-27");
    expect(latest?.date).toBe("2026-08-26");
    expect(latest?.notes).toEqual(["yesterday work"]);
  });

  it("getLatestBefore returns null when there is no prior record", () => {
    expect(mem.getLatestBefore("2026-08-27")).toBeNull();
  });

  it("appendNote grows the notes array instead of replacing it", () => {
    mem.appendNote("2026-08-27", "first", 1000);
    const after = mem.appendNote("2026-08-27", "second", 2000);
    expect(after.notes).toEqual(["first", "second"]);
  });
});

describe("summarizeDailyRecord", () => {
  it("handles no record", () => {
    expect(summarizeDailyRecord(null)).toContain("まだありません");
  });

  it("renders notes/completed/unfinished/decisions", () => {
    const text = summarizeDailyRecord({
      date: "2026-08-27",
      projects: [],
      decisions: ["Tauriを採用"],
      completedTasks: ["voice loop"],
      unfinishedTasks: ["wake word"],
      importantPeople: [],
      notes: ["SHOGUN開発"],
      updatedAt: 1000,
    });
    expect(text).toContain("SHOGUN開発");
    expect(text).toContain("voice loop");
    expect(text).toContain("wake word");
    expect(text).toContain("Tauriを採用");
  });
});
