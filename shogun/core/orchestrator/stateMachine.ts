/**
 * Conversation state machine (spec §16, docs/ARCHITECTURE.md §5):
 *
 *   IDLE → LISTENING → THINKING → SPEAKING → LISTENING → … → IDLE
 *
 * CONFIRMING/EXECUTING are modeled now (transitions accepted) even though
 * MVP0.1 never reaches them — it has no Level 1+ intents — so MVP0.2+
 * doesn't need to redesign this class when confirmation flows land.
 *
 * Deliberately pure/synchronous and dependency-free so it's unit-testable
 * without a WebSocket, mic, or the OpenAI API — see stateMachine.test.ts.
 */

export type ConversationState = "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "CONFIRMING" | "EXECUTING";

export type ConversationEvent =
  | "WAKE" // user clicked / pressed the global shortcut, or said the wake word
  | "USER_UTTERANCE" // transcription of a finished user turn arrived
  | "ASSISTANT_SPEECH_START"
  | "ASSISTANT_SPEECH_END"
  | "CONFIRMATION_NEEDED" // an intent handler returned a Level 2/3 pending action
  | "CONFIRMED"
  | "DENIED"
  | "EXECUTION_DONE"
  | "SLEEP"; // explicit "終わり"/"おやすみ" or the user closed the panel

const TRANSITIONS: Record<ConversationState, Partial<Record<ConversationEvent, ConversationState>>> = {
  IDLE: { WAKE: "LISTENING" },
  LISTENING: { USER_UTTERANCE: "THINKING", SLEEP: "IDLE" },
  THINKING: {
    ASSISTANT_SPEECH_START: "SPEAKING",
    CONFIRMATION_NEEDED: "CONFIRMING",
    SLEEP: "IDLE",
  },
  SPEAKING: { ASSISTANT_SPEECH_END: "LISTENING", SLEEP: "IDLE" },
  CONFIRMING: { CONFIRMED: "EXECUTING", DENIED: "LISTENING", SLEEP: "IDLE" },
  EXECUTING: { EXECUTION_DONE: "LISTENING", SLEEP: "IDLE" },
};

export class InvalidTransitionError extends Error {
  constructor(public readonly state: ConversationState, public readonly event: ConversationEvent) {
    super(`Cannot handle event "${event}" while in state "${state}"`);
    this.name = "InvalidTransitionError";
  }
}

export class ConversationStateMachine {
  private state: ConversationState = "IDLE";
  private listeners: Array<(state: ConversationState, event: ConversationEvent) => void> = [];

  getState(): ConversationState {
    return this.state;
  }

  onTransition(listener: (state: ConversationState, event: ConversationEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Applies `event`. Returns the new state. Unknown transitions for the
   * current state are ignored (return the unchanged state) rather than
   * throwing by default — e.g. a stray ASSISTANT_SPEECH_END while already
   * IDLE (a late event racing a SLEEP) shouldn't crash the session. Pass
   * `strict: true` to throw instead, which the test suite uses to pin
   * down exactly which transitions are intentionally defined.
   */
  handle(event: ConversationEvent, opts: { strict?: boolean } = {}): ConversationState {
    const next = TRANSITIONS[this.state][event];
    if (!next) {
      if (opts.strict) throw new InvalidTransitionError(this.state, event);
      return this.state;
    }
    this.state = next;
    for (const listener of this.listeners) listener(this.state, event);
    return this.state;
  }
}
