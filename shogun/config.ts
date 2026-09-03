/**
 * Root config loader for SHOGUN Core.
 *
 * Loads `.env` (see `.env.example`), validates it, and exports a single
 * typed config object. Every other module reads config from here rather
 * than touching `process.env` directly, so there is one place that knows
 * what's required and one place a startup check (`assertConfigReady`) can
 * fail loudly instead of a module crashing deep in a callback later.
 *
 * See docs/ARCHITECTURE.md §12 — this file currently lives at the repo
 * root rather than under core/context/, which is where it's expected to
 * move once core/context grows beyond "just config".
 */
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const ConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime-2.1"),
  OPENAI_REALTIME_VOICE: z.string().default("marin"),
  OPENAI_REALTIME_LANGUAGE: z.string().default("ja"),
  TURN_DETECTION_TYPE: z.enum(["semantic_vad", "server_vad"]).default("semantic_vad"),
  INTERRUPTION_MODE: z.enum(["barge-in", "mute-while-speaking"]).default("barge-in"),
  POST_SPEECH_MUTE_MS: z.coerce.number().int().nonnegative().default(800),
  DATABASE_URL: z.string().default("./database/shogun.sqlite"),
  SHOGUN_USER_NAME: z.string().default(""),
  SHOGUN_TIMEZONE: z.string().default("Asia/Tokyo"),
  CORE_WS_PORT: z.coerce.number().int().positive().default(8787),
  // Bind address for the local WS server. Defaults to loopback-only, which
  // is correct for local dev (`pnpm dev:core` + the Tauri shell on the same
  // machine). A cloud deployment (docs/DEPLOYMENT.md) sets this to
  // "0.0.0.0" so the platform's reverse proxy/load balancer can reach it —
  // never set it to "0.0.0.0" on a machine directly exposed to the
  // internet without also setting CORE_AUTH_TOKEN below.
  CORE_WS_HOST: z.string().default("127.0.0.1"),
  // Shared secret the desktop client must present to connect (see
  // core/orchestrator/server.ts's auth check). Optional for local dev
  // (loopback-only + no auth is an acceptable MVP0.1 default); required in
  // practice the moment CORE_WS_HOST is not loopback — see docs/SECURITY.md.
  CORE_AUTH_TOKEN: z.string().default(""),

  // --- ai/claude (Claude Code delegation) ---------------------------
  CLAUDE_BIN: z.string().default("claude"),
  // Where delegated tasks run. Defaults to the directory core was started
  // from; docs/SECURITY.md recommends pointing this at one project or
  // scratch directory rather than a home directory, since a voice command
  // has no confirmation step and no undo.
  CLAUDE_CWD: z.string().default(""),
  // Extra flags for `claude -p`, e.g. "--permission-mode acceptEdits".
  // Empty means Claude Code's own default permission handling, which in
  // headless mode will simply decline actions it would normally prompt
  // for — see docs/SECURITY.md before loosening this.
  CLAUDE_EXTRA_ARGS: z.string().default(""),
  CLAUDE_TIMEOUT_MS: z.coerce.number().int().positive().default(600000),
  CLAUDE_SESSION_FILE: z.string().default(""),
  // Delegation is off unless explicitly enabled: MVP0.1's conversation
  // loop is safe by construction, whereas delegation runs commands on the
  // user's machine. Opt in once CLAUDE_CWD points somewhere you trust.
  CLAUDE_DELEGATION_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // ASK BEFORE ACT (docs/ARCHITECTURE.md §5): a delegated task is read back
  // and confirmed out loud before it runs. Setting this to false waives
  // that per-task confirmation in favour of standing consent — itself a
  // Level 2/3 decision, so only do it with CLAUDE_CWD pointed at a
  // directory you would not mind losing (docs/SECURITY.md).
  CLAUDE_REQUIRE_CONFIRMATION: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type ShogunConfig = z.infer<typeof ConfigSchema>;

let cached: ShogunConfig | null = null;

/**
 * Parses and returns the config. Throws a ZodError with a readable message
 * on first access if something required is missing/invalid — call this
 * once at startup (see core/orchestrator/server.ts) so a bad `.env` fails
 * immediately instead of surfacing as a confusing error mid-conversation.
 */
export function getConfig(): ShogunConfig {
  if (!cached) {
    cached = ConfigSchema.parse(process.env);
  }
  return cached;
}

/** Test-only escape hatch to force a fresh parse against mutated env. */
export function resetConfigCacheForTests(): void {
  cached = null;
}
