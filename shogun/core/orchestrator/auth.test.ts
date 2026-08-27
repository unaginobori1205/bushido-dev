import { describe, expect, it } from "vitest";
import { assertBindingIsSafe, authorize, isLoopbackHost } from "./auth.js";

describe("isLoopbackHost", () => {
  it("recognizes common loopback spellings", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("::1")).toBe(true);
  });
  it("rejects a public/bind-all address", () => {
    expect(isLoopbackHost("0.0.0.0")).toBe(false);
    expect(isLoopbackHost("shogun.example.com")).toBe(false);
  });
});

describe("assertBindingIsSafe", () => {
  it("allows loopback with no token", () => {
    expect(() => assertBindingIsSafe("127.0.0.1", "")).not.toThrow();
  });
  it("allows a non-loopback host when a token is set", () => {
    expect(() => assertBindingIsSafe("0.0.0.0", "s3cret")).not.toThrow();
  });
  it("refuses a non-loopback host with no token", () => {
    expect(() => assertBindingIsSafe("0.0.0.0", "")).toThrow(/CORE_AUTH_TOKEN/);
  });
});

describe("authorize", () => {
  it("authorizes everything when no token is configured", () => {
    expect(authorize({ url: "/" }, "")).toBe(true);
    expect(authorize({ url: "/?token=wrong" }, "")).toBe(true);
  });
  it("requires a matching token when one is configured", () => {
    expect(authorize({ url: "/?token=s3cret" }, "s3cret")).toBe(true);
    expect(authorize({ url: "/?token=wrong" }, "s3cret")).toBe(false);
    expect(authorize({ url: "/" }, "s3cret")).toBe(false);
  });
  it("handles a missing url gracefully", () => {
    expect(authorize({ url: undefined }, "s3cret")).toBe(false);
  });
});
