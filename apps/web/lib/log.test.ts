import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { logError } from "./log.ts";

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
});
