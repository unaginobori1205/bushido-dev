/**
 * Auth for the core's WebSocket server (docs/DEPLOYMENT.md,
 * docs/SECURITY.md). Split out from server.ts so this — unlike the rest of
 * the composition root — is pure and unit-testable: getting "is this
 * server safely configured" and "is this specific connection authorized"
 * wrong is exactly the kind of thing that should have a test, not just a
 * manual smoke run.
 */
import type { IncomingMessage } from "node:http";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host);
}

/**
 * Fails fast at startup rather than silently running an unauthenticated
 * WebSocket server on a network-reachable address — the same "loud error
 * beats a confusing 3am incident" philosophy as config.ts's
 * OPENAI_API_KEY check. Loopback-only + no token is fine for local dev
 * (nothing outside the machine can reach it); anything else without a
 * token is a personal AI assistant anyone on the network/internet could
 * connect to and speak through.
 */
export function assertBindingIsSafe(host: string, authToken: string): void {
  if (!isLoopbackHost(host) && !authToken) {
    throw new Error(
      `CORE_WS_HOST is "${host}" (not loopback) but CORE_AUTH_TOKEN is empty. ` +
        "Refusing to start an unauthenticated server on a network-reachable address — " +
        "set CORE_AUTH_TOKEN (see docs/DEPLOYMENT.md and docs/SECURITY.md).",
    );
  }
}

/**
 * Checks `?token=...` on the WS upgrade request against `authToken`.
 * Always authorized when no token is configured — only reachable in
 * practice on loopback, since `assertBindingIsSafe` refuses to start
 * otherwise.
 */
export function authorize(req: Pick<IncomingMessage, "url">, authToken: string): boolean {
  if (!authToken) return true;
  const url = new URL(req.url ?? "", "http://internal");
  return url.searchParams.get("token") === authToken;
}
