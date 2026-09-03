/**
 * ai/claude — the CodingProvider (docs/ARCHITECTURE.md §3): SHOGUN's
 * "engineer". Delegates a spoken task to the user's own Claude Code via
 * headless mode:
 *
 *   claude -p "<instruction>" --output-format json [--resume <session>]
 *
 * That contract was smoke-tested against the real CLI while building this
 * (it returns one JSON object with `session_id`, `result`, `is_error`),
 * which is what `parseClaudeResult` below expects.
 *
 * Two deliberate constraints, both from docs/SECURITY.md:
 *  - This runs Claude Code as the local user, in `cwd`, with whatever
 *    permissions `extraArgs` grants. It is only ever reached through
 *    `core/permissions` — never call `run()` directly from an intent
 *    handler.
 *  - It refuses to run at all when core is cloud-hosted (see
 *    `assertRunnableHere`): the user's Claude Code login, projects and
 *    files live on their machine, so a cloud core delegating "edit my
 *    files" would either fail confusingly or act on the wrong machine.
 */
import { spawn } from "node:child_process";
import { SessionStore } from "./sessionStore.js";

export interface CodingProviderResult {
  /** Claude Code's final text answer, suitable for speaking back. */
  text: string;
  sessionId?: string;
  isError: boolean;
}

export interface ClaudeBridgeOptions {
  claudeBin: string;
  cwd: string;
  /** Extra flags for `claude -p`, e.g. ["--permission-mode","acceptEdits"]. */
  extraArgs: string[];
  timeoutMs: number;
  sessionStore: SessionStore;
}

/** Splits a config string like `--permission-mode acceptEdits` into argv parts. */
export function parseExtraArgs(raw: string): string[] {
  return raw.split(/\s+/).filter(Boolean);
}

export function buildClaudeArgs(instruction: string, sessionId: string | undefined, extraArgs: string[]): string[] {
  const args = ["-p", instruction, "--output-format", "json"];
  if (sessionId) args.push("--resume", sessionId);
  return [...args, ...extraArgs];
}

/**
 * Reads the last JSON object printed by `claude -p --output-format json`.
 * Falls back to treating raw stdout as the answer, so an unexpected output
 * shape degrades to "spoke something slightly odd" rather than "silently
 * did nothing".
 */
export function parseClaudeResult(stdout: string): CodingProviderResult {
  const trimmed = stdout.trim();
  if (!trimmed) return { text: "", isError: true };
  const lastLine = trimmed.split("\n").pop() ?? trimmed;
  try {
    const parsed = JSON.parse(lastLine) as Record<string, unknown>;
    const text = typeof parsed.result === "string" ? parsed.result : "";
    return {
      text,
      sessionId: typeof parsed.session_id === "string" ? parsed.session_id : undefined,
      isError: parsed.is_error === true || !text,
    };
  } catch {
    return { text: trimmed, isError: false };
  }
}

export class CloudCoreNotSupportedError extends Error {
  constructor() {
    super(
      "Claude Code delegation only works when core runs on the machine that has your Claude Code install and your projects. " +
        "This core is running on a remote host — start it locally with `pnpm dev:core` for coding tasks (docs/DEPLOYMENT.md).",
    );
    this.name = "CloudCoreNotSupportedError";
  }
}

/**
 * Cloud-hosted core (CORE_WS_HOST bound off-loopback) can serve the
 * conversation loop but not coding delegation — see the header note and
 * docs/DEPLOYMENT.md's "not part of this change" section.
 */
export function assertRunnableHere(coreWsHost: string): void {
  const loopback = coreWsHost === "127.0.0.1" || coreWsHost === "localhost" || coreWsHost === "::1";
  if (!loopback) throw new CloudCoreNotSupportedError();
}

export class ClaudeBridge {
  constructor(private readonly opts: ClaudeBridgeOptions) {}

  async run(instruction: string): Promise<CodingProviderResult> {
    const { claudeBin, cwd, extraArgs, timeoutMs, sessionStore } = this.opts;
    const args = buildClaudeArgs(instruction, sessionStore.get(cwd), extraArgs);

    return new Promise<CodingProviderResult>((resolve) => {
      // spawn (not exec/shell) so the spoken instruction is one argv entry
      // and can never be interpreted as shell syntax.
      // stdio: stdin closed on purpose. `claude -p` waits ~3s for piped
      // stdin before giving up ("no stdin data received in 3s"), which
      // would add that delay to every single delegated task; the
      // instruction is already in argv, so there is nothing to pipe.
      const child = spawn(claudeBin, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let settled = false;

      const finish = (result: CodingProviderResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (result.sessionId) sessionStore.set(cwd, result.sessionId);
        resolve(result);
      };

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        finish({ text: `作業が${Math.round(timeoutMs / 60000)}分を超えたため中断しました。`, isError: true });
      }, timeoutMs);

      child.stdout.on("data", (d) => (stdout += String(d)));
      child.stderr.on("data", (d) => (stderr += String(d)));
      child.on("error", (err) => finish({ text: `Claude Codeを起動できませんでした: ${err.message}`, isError: true }));
      child.on("close", (code) => {
        if (!stdout.trim() && code !== 0) {
          finish({ text: `Claude Codeがエラーで終了しました (exit ${code}): ${stderr.slice(0, 300)}`, isError: true });
          return;
        }
        finish(parseClaudeResult(stdout));
      });
    });
  }
}
