import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SessionStore, parseSessionMap } from "./sessionStore.js";

describe("parseSessionMap", () => {
  it("reads a well-formed map", () => {
    expect(parseSessionMap('{"/a":"s1"}')).toEqual({ "/a": "s1" });
  });
  it("survives corrupt or unexpected content instead of throwing", () => {
    expect(parseSessionMap("not json")).toEqual({});
    expect(parseSessionMap("[1,2]")).toEqual({});
    expect(parseSessionMap('{"/a":123}')).toEqual({});
  });
});

describe("SessionStore", () => {
  let dir: string;
  let store: SessionStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "shogun-sess-"));
    store = new SessionStore(join(dir, "nested", "claude-sessions.json"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns undefined before anything is stored", () => {
    expect(store.get("/project")).toBeUndefined();
  });

  it("round-trips a session id, creating the directory", () => {
    store.set("/project", "sess-1");
    expect(store.get("/project")).toBe("sess-1");
  });

  it("keys by directory so projects don't resume each other's sessions", () => {
    store.set("/a", "sess-a");
    store.set("/b", "sess-b");
    expect(store.get("/a")).toBe("sess-a");
    expect(store.get("/b")).toBe("sess-b");
  });

  it("clear() forgets one project only", () => {
    store.set("/a", "sess-a");
    store.set("/b", "sess-b");
    store.clear("/a");
    expect(store.get("/a")).toBeUndefined();
    expect(store.get("/b")).toBe("sess-b");
  });
});
