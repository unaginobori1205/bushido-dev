# Runs core/orchestrator/server.ts as a small, always-on personal service
# (docs/DEPLOYMENT.md) — the Tauri desktop shell (apps/desktop/) is a
# separate, local-only client and is deliberately NOT part of this image;
# see .dockerignore.
#
# Ships the TypeScript source and runs it through `tsx` rather than
# precompiling to JS — this is exactly the execution path already smoke-
# tested during development (`node --import tsx core/orchestrator/server.ts`),
# and precompiling would need extra path-handling for
# prompts/shogun-system.md (loaded relative to the running file) to keep
# working. Revisit if the extra ~100ms tsx startup cost ever matters for a
# single long-running process — it doesn't for this use case.
FROM node:20-bookworm-slim

WORKDIR /app

# better-sqlite3 is a native module. node:20-bookworm-slim usually gets a
# prebuilt binary via prebuild-install, but these build tools are the
# fallback (node-gyp) so the image doesn't depend on a prebuild existing
# for whatever platform it's built on — this environment couldn't run an
# actual `docker build` to confirm which path better-sqlite3 takes here
# (no docker daemon available), so keep the fallback rather than assume.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  # devDependencies included on purpose — tsx and typescript run in
  # production too, per the note above.
  && pnpm install --frozen-lockfile

COPY config.ts tsconfig.json ./
COPY core ./core
COPY memory ./memory
COPY database ./database
COPY ai/openai ./ai/openai
COPY prompts ./prompts

ENV NODE_ENV=production
# Overridable at deploy time; docs/DEPLOYMENT.md sets CORE_WS_HOST=0.0.0.0
# and CORE_AUTH_TOKEN via the platform's secrets — core/orchestrator/
# auth.ts refuses to start otherwise.
EXPOSE 8787

CMD ["node", "--import", "tsx", "core/orchestrator/server.ts"]
