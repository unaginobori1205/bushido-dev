import { describe, expect, it } from "vitest";
import { PermissionLevel } from "../permissions/index.js";
import {
  DELEGATE_TOOL_DEFINITION,
  DELEGATE_TOOL_NAME,
  parseDelegateIntent,
  toPendingAction,
} from "./index.js";

describe("DELEGATE_TOOL_DEFINITION", () => {
  it("declares instruction as the only required argument", () => {
    expect(DELEGATE_TOOL_DEFINITION.parameters.required).toEqual(["instruction"]);
  });
  it("tells the model to announce an ETA before calling (IMPLEMENTATION_PLAN §10)", () => {
    expect(DELEGATE_TOOL_DEFINITION.description).toMatch(/how long/i);
  });
});

describe("parseDelegateIntent", () => {
  it("parses a well-formed call", () => {
    const intent = parseDelegateIntent("call-1", DELEGATE_TOOL_NAME, JSON.stringify({ instruction: "make slides", estimate: "3分" }));
    expect(intent).toEqual({
      kind: "delegate_to_claude_code",
      callId: "call-1",
      instruction: "make slides",
      estimate: "3分",
      confirmed: false,
    });
  });

  it("defaults confirmed to false when absent or non-boolean", () => {
    expect(parseDelegateIntent("c", DELEGATE_TOOL_NAME, '{"instruction":"x"}')?.confirmed).toBe(false);
    expect(parseDelegateIntent("c", DELEGATE_TOOL_NAME, '{"instruction":"x","confirmed":"true"}')?.confirmed).toBe(false);
  });

  it("carries confirmed:true through", () => {
    expect(parseDelegateIntent("c", DELEGATE_TOOL_NAME, '{"instruction":"x","confirmed":true}')?.confirmed).toBe(true);
  });

  it("ignores other tools, empty call ids, malformed JSON and blank instructions", () => {
    expect(parseDelegateIntent("c", "some_other_tool", '{"instruction":"x"}')).toBeNull();
    expect(parseDelegateIntent("", DELEGATE_TOOL_NAME, '{"instruction":"x"}')).toBeNull();
    expect(parseDelegateIntent("c", DELEGATE_TOOL_NAME, "{not json")).toBeNull();
    expect(parseDelegateIntent("c", DELEGATE_TOOL_NAME, '{"instruction":"   "}')).toBeNull();
  });
});

describe("toPendingAction", () => {
  it("classifies delegated work as Level 2 (CONFIRM)", () => {
    const intent = parseDelegateIntent("c", DELEGATE_TOOL_NAME, '{"instruction":"delete old builds"}');
    expect(intent).not.toBeNull();
    const action = toPendingAction(intent!);
    expect(action.level).toBe(PermissionLevel.CONFIRM);
    expect(action.id).toBe("c");
    expect(action.description).toContain("delete old builds");
  });
});
