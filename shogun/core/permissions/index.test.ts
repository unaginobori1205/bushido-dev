import { describe, expect, it } from "vitest";
import {
  PermissionLevel,
  PermissionDeniedError,
  assertAutoRunnable,
  requiresConfirmation,
  isSufficientCriticalConfirmation,
} from "./index.js";

function action(level: PermissionLevel, description = "test action") {
  return { id: "a1", level, description };
}

describe("assertAutoRunnable", () => {
  it("allows READ", () => expect(() => assertAutoRunnable(action(PermissionLevel.READ))).not.toThrow());
  it("allows PREPARE", () => expect(() => assertAutoRunnable(action(PermissionLevel.PREPARE))).not.toThrow());
  it("blocks CONFIRM", () => expect(() => assertAutoRunnable(action(PermissionLevel.CONFIRM))).toThrow(PermissionDeniedError));
  it("blocks CRITICAL", () => expect(() => assertAutoRunnable(action(PermissionLevel.CRITICAL))).toThrow(PermissionDeniedError));
});

describe("requiresConfirmation", () => {
  it("is false below CONFIRM", () => {
    expect(requiresConfirmation(action(PermissionLevel.READ))).toBe(false);
    expect(requiresConfirmation(action(PermissionLevel.PREPARE))).toBe(false);
  });
  it("is true at/above CONFIRM", () => {
    expect(requiresConfirmation(action(PermissionLevel.CONFIRM))).toBe(true);
    expect(requiresConfirmation(action(PermissionLevel.CRITICAL))).toBe(true);
  });
});

describe("isSufficientCriticalConfirmation", () => {
  it("anything is sufficient below CRITICAL", () => {
    expect(isSufficientCriticalConfirmation(action(PermissionLevel.CONFIRM), "はい")).toBe(true);
  });
  it("rejects a bare yes/はい for CRITICAL", () => {
    const a = action(PermissionLevel.CRITICAL);
    expect(isSufficientCriticalConfirmation(a, "はい")).toBe(false);
    expect(isSufficientCriticalConfirmation(a, "yes")).toBe(false);
    expect(isSufficientCriticalConfirmation(a, "ok")).toBe(false);
  });
  it("accepts a restated confirmation for CRITICAL", () => {
    const a = action(PermissionLevel.CRITICAL, "delete report.pdf");
    expect(isSufficientCriticalConfirmation(a, "report.pdfを削除して")).toBe(true);
  });
});
