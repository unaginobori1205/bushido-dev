/**
 * Root config loader for SHOGUN Core.
 *
 * Loads `.env` (see `.env.example`), validates it, and exports a single
 * typed config object. Every other module reads config from here rather
 * than touching `process.env` directly, so there is one place that knows
 * what's required and one place a startup check (`assertConfigReady`) can
 * fail loudly instead of a module crashing deep in a callback later.
 *
 * See docs/ARCHITECTURE.md §10 — this file currently lives at the repo
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
