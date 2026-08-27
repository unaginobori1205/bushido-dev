import { describe, expect, it } from "vitest";
import { ConversationStateMachine, InvalidTransitionError } from "./stateMachine.js";

describe("ConversationStateMachine", () => {
  it("starts IDLE", () => {
    expect(new ConversationStateMachine().getState()).toBe("IDLE");
  });

  it("walks the happy path IDLE→LISTENING→THINKING→SPEAKING→LISTENING", () => {
    const sm = new ConversationStateMachine();
    expect(sm.handle("WAKE")).toBe("LISTENING");
    expect(sm.handle("USER_UTTERANCE")).toBe("THINKING");
    expect(sm.handle("ASSISTANT_SPEECH_START")).toBe("SPEAKING");
    expect(sm.handle("ASSISTANT_SPEECH_END")).toBe("LISTENING");
  });

  it("SLEEP returns to IDLE from any active state", () => {
    for (const path of [["WAKE"], ["WAKE", "USER_UTTERANCE"], ["WAKE", "USER_UTTERANCE", "ASSISTANT_SPEECH_START"]] as const) {
      const sm = new ConversationStateMachine();
      for (const e of path) sm.handle(e);
      expect(sm.handle("SLEEP")).toBe("IDLE");
    }
  });

  it("routes THINKING→CONFIRMING→EXECUTING→LISTENING for a Level 2+ intent", () => {
    const sm = new ConversationStateMachine();
    sm.handle("WAKE");
    sm.handle("USER_UTTERANCE");
    expect(sm.handle("CONFIRMATION_NEEDED")).toBe("CONFIRMING");
    expect(sm.handle("CONFIRMED")).toBe("EXECUTING");
    expect(sm.handle("EXECUTION_DONE")).toBe("LISTENING");
  });

  it("DENIED from CONFIRMING goes back to LISTENING, not EXECUTING", () => {
    const sm = new ConversationStateMachine();
    sm.handle("WAKE");
    sm.handle("USER_UTTERANCE");
    sm.handle("CONFIRMATION_NEEDED");
    expect(sm.handle("DENIED")).toBe("LISTENING");
  });

  it("an unhandled event is a no-op by default", () => {
    const sm = new ConversationStateMachine();
    expect(sm.handle("ASSISTANT_SPEECH_END")).toBe("IDLE");
  });

  it("strict mode throws InvalidTransitionError on an unhandled event", () => {
    const sm = new ConversationStateMachine();
    expect(() => sm.handle("ASSISTANT_SPEECH_END", { strict: true })).toThrow(InvalidTransitionError);
  });

  it("notifies listeners on every transition", () => {
    const sm = new ConversationStateMachine();
    const seen: string[] = [];
    sm.onTransition((state, event) => seen.push(`${event}->${state}`));
    sm.handle("WAKE");
    sm.handle("USER_UTTERANCE");
    expect(seen).toEqual(["WAKE->LISTENING", "USER_UTTERANCE->THINKING"]);
  });
});
