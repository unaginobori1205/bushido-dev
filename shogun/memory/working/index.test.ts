import { describe, expect, it } from "vitest";
import { WorkingMemory } from "./index.js";

describe("WorkingMemory", () => {
  it("keeps turns in order", () => {
    const mem = new WorkingMemory();
    mem.push({ role: "user", text: "おはよう", at: 1 });
    mem.push({ role: "assistant", text: "おはようございます", at: 2 });
    expect(mem.getTurns().map((t) => t.text)).toEqual(["おはよう", "おはようございます"]);
    expect(mem.length).toBe(2);
  });

  it("caps at maxTurns, dropping the oldest first", () => {
    const mem = new WorkingMemory({ maxTurns: 2 });
    mem.push({ role: "user", text: "a", at: 1 });
    mem.push({ role: "user", text: "b", at: 2 });
    mem.push({ role: "user", text: "c", at: 3 });
    expect(mem.getTurns().map((t) => t.text)).toEqual(["b", "c"]);
  });

  it("renders a readable transcript", () => {
    const mem = new WorkingMemory();
    mem.push({ role: "user", text: "hi", at: 1 });
    mem.push({ role: "assistant", text: "hello", at: 2 });
    expect(mem.toTranscript()).toBe("User: hi\nSHOGUN: hello");
  });

  it("clear() empties the buffer", () => {
    const mem = new WorkingMemory();
    mem.push({ role: "user", text: "hi", at: 1 });
    mem.clear();
    expect(mem.length).toBe(0);
  });
});
