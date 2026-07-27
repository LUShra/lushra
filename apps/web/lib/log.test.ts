import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { logError, logEvent } from "./log.ts";

describe("logError", () => {
  let originalConsoleError: typeof console.error;
  let captured: string[];

  beforeEach(() => {
    captured = [];
    originalConsoleError = console.error;
    console.error = (line: string) => {
      captured.push(line);
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test("emits a single JSON line with level, event, and timestamp", () => {
    logError("test_event_failed", { workspaceId: "abc-123" });

    assert.equal(captured.length, 1);

    const entry = JSON.parse(captured[0]);
    assert.equal(entry.level, "error");
    assert.equal(entry.event, "test_event_failed");
    assert.equal(entry.workspaceId, "abc-123");
    assert.equal(typeof entry.timestamp, "string");
    assert.ok(!Number.isNaN(Date.parse(entry.timestamp)), "timestamp must be a valid ISO date");
  });

  test("works with no context at all", () => {
    logError("bare_event");

    const entry = JSON.parse(captured[0]);
    assert.equal(entry.event, "bare_event");
    assert.equal(entry.level, "error");
  });

  test("never lets context override level/event/timestamp", () => {
    logError("real_event", {
      level: "not-an-error" as unknown as string,
      event: "spoofed" as unknown as string
    });

    const entry = JSON.parse(captured[0]);
    assert.equal(entry.level, "error");
    assert.equal(entry.event, "real_event");
  });

  test("always includes a non-empty environment field", () => {
    logError("test_event_failed");

    const entry = JSON.parse(captured[0]);
    assert.equal(typeof entry.environment, "string");
    assert.ok(entry.environment.length > 0);
  });

  test("never lets context override environment", () => {
    logError("real_event", { environment: "spoofed" as unknown as string });

    const entry = JSON.parse(captured[0]);
    assert.notEqual(entry.environment, "spoofed");
  });
});

describe("logEvent", () => {
  let originalInfo: typeof console.info;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;
  let capturedInfo: string[];
  let capturedWarn: string[];
  let capturedError: string[];

  beforeEach(() => {
    capturedInfo = [];
    capturedWarn = [];
    capturedError = [];
    originalInfo = console.info;
    originalWarn = console.warn;
    originalError = console.error;
    console.info = (line: string) => {
      capturedInfo.push(line);
    };
    console.warn = (line: string) => {
      capturedWarn.push(line);
    };
    console.error = (line: string) => {
      capturedError.push(line);
    };
  });

  afterEach(() => {
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  });

  test("routes 'info' to console.info only", () => {
    logEvent("info", "auth_sign_in_succeeded", { userId: "u1" });

    assert.equal(capturedInfo.length, 1);
    assert.equal(capturedWarn.length, 0);
    assert.equal(capturedError.length, 0);

    const entry = JSON.parse(capturedInfo[0]);
    assert.equal(entry.level, "info");
    assert.equal(entry.event, "auth_sign_in_succeeded");
    assert.equal(entry.userId, "u1");
  });

  test("routes 'warn' to console.warn only", () => {
    logEvent("warn", "auth_protected_route_denied");

    assert.equal(capturedWarn.length, 1);
    assert.equal(capturedInfo.length, 0);
    assert.equal(capturedError.length, 0);

    const entry = JSON.parse(capturedWarn[0]);
    assert.equal(entry.level, "warn");
  });

  test("routes 'error' to console.error only, matching logError", () => {
    logEvent("error", "auth_sign_in_failed");

    assert.equal(capturedError.length, 1);
    assert.equal(capturedInfo.length, 0);
    assert.equal(capturedWarn.length, 0);
  });
});
