# SHOGUN — Deploying core to the cloud

Status: **implemented, not end-to-end verified** — see the verification
note at the bottom. This doc covers the "make SHOGUN's core usable from
the cloud" change: `core/orchestrator/server.ts` can now run on a small
always-on host instead of only on the user's Mac via `pnpm dev:core`, so
SHOGUN stays reachable even when the Mac is closed/off, and so the same
core could later be reached from more than one client (the Tauri desktop
app today; a phone or browser client would be a natural follow-up, not
part of this change).

The Tauri desktop shell (`apps/desktop/`) is unchanged in what it *does* —
it still owns mic/speaker/tray/shortcut — only *where it connects* is now
configurable (the ⚙ settings panel in the app, or `localStorage` directly;
see `apps/desktop/src/settings.js`).

## What changed to make this safe

Previously `core/orchestrator/server.ts` only ever bound to
`127.0.0.1` — nothing outside the machine could reach it, so it needed no
authentication. Exposing it to the internet changes that:

- `CORE_WS_HOST` — bind address. Stays `127.0.0.1` for local dev; a cloud
  deploy sets it to `0.0.0.0` so the platform's proxy can reach it.
- `CORE_AUTH_TOKEN` — a shared secret. `core/orchestrator/auth.ts`
  **refuses to start** if `CORE_WS_HOST` isn't loopback and this is empty
  — see that file's tests (`auth.test.ts`) for the exact rule. Every
  WebSocket connection must include `?token=<CORE_AUTH_TOKEN>` in the URL
  or gets closed immediately (code 1008).

This is a single shared secret, appropriate for a **single-user personal
assistant** — it is not a multi-user auth system and doesn't need to be
one. Treat the token like a password: generate it randomly, store it as a
platform secret (never commit it, never put it in `fly.toml`), and rotate
it if you ever suspect it leaked (e.g. pasted somewhere by mistake — see
the same principle in `docs/SECURITY.md` for API keys).

```bash
# generate a reasonable token
openssl rand -hex 24
```

## Option A — Fly.io (recommended: small, persistent, cheap, one command to deploy)

Fly.io fits this well: one small always-on VM, a persistent volume for the
SQLite database, automatic TLS termination (so the app itself never has to
handle certificates), and WebSocket support out of the box.

1. Install the Fly CLI and log in: https://fly.io/docs/flyctl/install/
2. From `shogun/`:
   ```bash
   fly launch --no-deploy   # picks up fly.toml; edit `app` to a unique name first
   fly volumes create shogun_data --size 1 --region nrt   # match fly.toml's primary_region
   fly secrets set OPENAI_API_KEY=sk-... CORE_AUTH_TOKEN=$(openssl rand -hex 24)
   fly deploy
   ```
3. Your core is now at `wss://<app-name>.fly.dev` (Fly terminates TLS —
   `force_https = true` in `fly.toml` means plain `ws://` is redirected).
4. In the desktop app, click ⚙ and set:
   - Core URL: `wss://<app-name>.fly.dev`
   - Token: the `CORE_AUTH_TOKEN` value you set above
   - Save して再接続 (Save & reconnect)

To see the token you set (if you didn't save it elsewhere):
`fly secrets list` shows names, not values — keep your own record (a
password manager, not a repo file) when you generate it.

## Option B — any other Docker host

The `Dockerfile` is platform-agnostic. On a plain VPS, Railway, Render, or
similar:

```bash
docker build -t shogun-core .
docker run -d \
  -p 8787:8787 \
  -e OPENAI_API_KEY=sk-... \
  -e CORE_WS_HOST=0.0.0.0 \
  -e CORE_AUTH_TOKEN=$(openssl rand -hex 24) \
  -v shogun_data:/data \
  -e DATABASE_URL=/data/shogun.sqlite \
  shogun-core
```

Put a TLS-terminating reverse proxy (Caddy, nginx, the platform's own
edge) in front of it so the desktop app connects over `wss://`, not plain
`ws://`, once it leaves your machine/VPC — the app itself only speaks
plain WebSocket and expects TLS to be handled in front of it, the same as
the Fly.io setup.

## Notes / limitations

- **SQLite needs a real, persistent, single-writer disk.** This deploys
  cleanly to one always-on machine with a volume (both options above). It
  does **not** work on scale-to-zero/multi-instance serverless platforms
  without also swapping the storage layer — don't deploy this to a
  platform that might run more than one instance against the same
  `DATABASE_URL` file, or that recycles the filesystem between requests.
- **One shared token, one user.** If SHOGUN ever needs multiple people or
  per-client permissions, `core/orchestrator/auth.ts`'s single-token check
  is the first thing to replace — it was a deliberate MVP choice, not an
  oversight.
- **`ai/claude` (headless Claude Code) is not part of this deploy.**
  MVP0.1/this change doesn't wire Claude Code into the orchestrator yet
  (that's MVP0.3). When it does land, running Claude Code on a remote
  server instead of the user's own machine is a materially bigger decision
  (it would need its own auth/session/working-directory story, and would
  no longer be "the Claude Code you normally use" locally) — revisit
  explicitly at that point rather than assuming this deployment target
  still fits.

## Verification

This environment has no Docker daemon (`docker info` fails — no
`dockerd` available) and no Fly.io account, so the following are
**implemented but not run end-to-end here**:

- An actual `docker build` of the `Dockerfile` (in particular, whether
  `better-sqlite3` needs the `node-gyp` fallback path or gets a prebuilt
  binary on `node:20-bookworm-slim` — the Dockerfile keeps the build-tools
  fallback installed either way, so it should work regardless, but that's
  reasoning, not a build log).
- A real `fly deploy` / `fly volumes create` / `fly secrets set` cycle.
- The desktop app actually reconnecting to a real `wss://` endpoint.

What **was** verified in this environment: `core/orchestrator/auth.ts`'s
logic (unit tests — refuses non-loopback + no token, authorizes matching
tokens, rejects mismatches), and a manual run of `server.ts` confirming it
(a) refuses to start with `CORE_WS_HOST=0.0.0.0` and no token, and (b)
starts and listens correctly once a token is set. Please run through
Option A or B for real before relying on this for daily use, and report
back anything that doesn't match this doc.
