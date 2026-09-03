# mcp/client

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Thin MCP client (`@modelcontextprotocol/sdk`) used only for frequent, latency-sensitive Level-0 reads (today's calendar, task list). Everything else is delegated to `ai/claude` — see the reuse note in `docs/ARCHITECTURE.md` §7 and `docs/MCP_REGISTRY.md`. Target milestone: MVP0.4.
