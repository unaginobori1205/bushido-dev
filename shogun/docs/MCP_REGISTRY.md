# SHOGUN — MCP Registry (design)

`mcp/registry` holds a declarative list of MCP servers SHOGUN may call, each
tagged with a permission scope. `mcp/client` must consult this before
issuing a write call — a server registered `read-only` cannot be used for a
write operation even if the underlying MCP server would technically allow
it.

## Schema (draft)

```json
{
  "servers": [
    {
      "name": "calendar",
      "transport": "stdio | sse | http",
      "command_or_url": "...",
      "permission": "read-only | read-write",
      "enabled": true,
      "notes": "Google Calendar MCP"
    },
    {
      "name": "gmail",
      "transport": "stdio",
      "command_or_url": "...",
      "permission": "read-draft-send",
      "enabled": true,
      "notes": "draft creation is Level 1 (PREPARE); send is Level 2 (CONFIRM)"
    },
    {
      "name": "github",
      "transport": "stdio",
      "command_or_url": "...",
      "permission": "read-write",
      "enabled": true
    }
  ]
}
```

`permission` values map directly to the Permission Level model in
`ARCHITECTURE.md` §5:

| `permission` value | Allowed operations | Default Permission Level |
|---|---|---|
| `read-only` | list/get/search | 0 |
| `read-draft-send` | list/get/search, create-draft | 0/1 for read+draft, 2 for send |
| `read-write` | any tool the server exposes | 0 for read tools, 2 (or 3 for destructive ones) for write tools |

## Discovery

MVP0.4 should be able to enumerate whatever MCP servers are actually
connected (dynamic detection, per spec §6) rather than requiring the
registry file to be hand-maintained forever. Until then, the registry file
above is the source of truth and is edited by hand.

## Reuse vs. reimplement

See `ARCHITECTURE.md` §7: cheap/frequent Level-0 reads go through
`mcp/client` directly; everything else is delegated to `ai/claude`
(headless Claude Code), which already has broad MCP access configured at
the account level in this environment. `mcp/registry` should record *both*
kinds of access so `core/permissions` has one place to check regardless of
which path handled the call.

## Status

Design only — no live registry file or working `mcp/client` yet. Slated for
MVP0.4 per `IMPLEMENTATION_PLAN.md`.
