import { describe, expect, it } from "vitest";
import {
  CloudCoreNotSupportedError,
  assertRunnableHere,
  buildClaudeArgs,
  parseClaudeResult,
  parseExtraArgs,
} from "./claudeBridge.js";

describe("parseExtraArgs", () => {
  it("splits a flag string into argv parts", () => {
    expect(parseExtraArgs("--permission-mode acceptEdits")).toEqual(["--permission-mode", "acceptEdits"]);
  });
  it("returns nothing for empty/whitespace config", () => {
    expect(parseExtraArgs("")).toEqual([]);
    expect(parseExtraArgs("   ")).toEqual([]);
  });
});

describe("buildClaudeArgs", () => {
  it("always uses headless mode with JSON output", () => {
    expect(buildClaudeArgs("do a thing", undefined, [])).toEqual(["-p", "do a thing", "--output-format", "json"]);
  });
  it("resumes a known session", () => {
    expect(buildClaudeArgs("more", "sess-1", [])).toContain("--resume");
    expect(buildClaudeArgs("more", "sess-1", [])).toContain("sess-1");
  });
  it("appends extra args last so they can override defaults", () => {
    const args = buildClaudeArgs("x", undefined, ["--permission-mode", "acceptEdits"]);
    expect(args.slice(-2)).toEqual(["--permission-mode", "acceptEdits"]);
  });
  it("keeps the instruction as a single argv entry (no shell interpretation)", () => {
    const args = buildClaudeArgs('rm -rf / ; echo "hi"', undefined, []);
    expect(args[1]).toBe('rm -rf / ; echo "hi"');
  });
});

describe("parseClaudeResult", () => {
  it("reads the real CLI's JSON shape", () => {
    const stdout = JSON.stringify({ is_error: false, session_id: "abc", result: "done", type: "result" });
    expect(parseClaudeResult(stdout)).toEqual({ text: "done", sessionId: "abc", isError: false });
  });
  it("takes the last JSON line when several are printed", () => {
    const stdout = ['{"type":"progress"}', JSON.stringify({ result: "finished", session_id: "s2" })].join("\n");
    expect(parseClaudeResult(stdout).text).toBe("finished");
  });
  it("flags an error result", () => {
    const stdout = JSON.stringify({ is_error: true, result: "boom", session_id: "s" });
    expect(parseClaudeResult(stdout).isError).toBe(true);
  });
  it("treats empty output as an error rather than silent success", () => {
    expect(parseClaudeResult("   ").isError).toBe(true);
  });
  it("falls back to raw text when output is not JSON", () => {
    expect(parseClaudeResult("plain answer")).toEqual({ text: "plain answer", isError: false });
  });
});

describe("assertRunnableHere", () => {
  it("allows a loopback-bound (local) core", () => {
    expect(() => assertRunnableHere("127.0.0.1")).not.toThrow();
    expect(() => assertRunnableHere("localhost")).not.toThrow();
  });
  it("refuses when core is cloud-hosted", () => {
    expect(() => assertRunnableHere("0.0.0.0")).toThrow(CloudCoreNotSupportedError);
  });
});
