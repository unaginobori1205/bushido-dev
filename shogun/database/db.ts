/**
 * Local SQLite database (docs/ARCHITECTURE.md §8, §MCP reuse note) backing
 * memory/daily and the Action Log. Single-user, single-machine, no server
 * to run or secure — see docs/SECURITY.md for what must never be logged
 * here.
 */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type ShogunDatabase = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS daily_memory (
  date TEXT PRIMARY KEY,             -- YYYY-MM-DD
  projects TEXT NOT NULL DEFAULT '[]',
  decisions TEXT NOT NULL DEFAULT '[]',
  completed_tasks TEXT NOT NULL DEFAULT '[]',
  unfinished_tasks TEXT NOT NULL DEFAULT '[]',
  important_people TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  user_request TEXT NOT NULL,
  intent TEXT,
  tool TEXT,
  parameters TEXT,
  permission_level INTEGER,
  confirmation TEXT,
  result TEXT
);
`;

/**
 * Opens (creating if needed) the SQLite file at `path` and ensures the
 * schema exists. Safe to call multiple times (CREATE TABLE IF NOT EXISTS).
 */
export function openDatabase(path: string): ShogunDatabase {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}
