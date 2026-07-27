import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { AUTH_EVENTS, logAuthEvent, normalizeAuthError } from "./auth-events.ts";

describe("AUTH_EVENTS taxonomy", () => {
  test("every event name is a non-empty, stable string", () => {
    for (const [key, value] of Object.entries(AUTH_EVENTS)) {
      assert.equal(typeof value, "string", `${key} should be a string`);
      assert.ok(value.length > 0, `${key} should not be empty`);
      assert.ok(value.startsWith("auth_"), `${key} ("${value}") should be namespaced auth_*`);
    }
  });

  test("no two events share the same name", () => {
    const values = Object.values(AUTH_EVENTS);
    const unique = new Set(values);
    assert.equal(unique.size, values.length, "every event name must be unique");
  });

  test("covers every event this milestone requires", () => {
    const required = [
      "signUpSucceeded",
      "signUpFailed",
      "signInSucceeded",
      "signInFailed",
      "signedOut",
      "passwordRecoveryRequested",
      "passwordRecoveryFailed",
      "passwordUpdateSucceeded",
      "passwordUpdateFailed",
      "confirmationSucceeded",
      "confirmationFailed",
      "protectedRouteDenied"
    ];

    for (const key of required) {
      assert.ok(key in AUTH_EVENTS, `AUTH_EVENTS is missing ${key}`);
    }
  });
});

describe("normalizeAuthError", () => {
  test("extracts code and message, preferring the explicit code", () => {
    const error = { code: "invalid_credentials", status: 400, message: "Invalid login credentials" };
    const result = normalizeAuthError(error as never);

    assert.deepEqual(result, { errorCode: "invalid_credentials", message: "Invalid login credentials" });
  });

  test("falls back to the HTTP status when no code is present", () => {
    const error = { code: undefined, status: 429, message: "Rate limit exceeded" };
    const result = normalizeAuthError(error as never);

    assert.equal(result.errorCode, "429");
    assert.equal(result.message, "Rate limit exceeded");
  });

  test("falls back to 'unknown' when neither code nor status is present", () => {
    const error = { code: undefined, status: undefined, message: "Something went wrong" };
    const result = normalizeAuthError(error as never);

    assert.equal(result.errorCode, "unknown");
  });

  test("never forwards fields beyond errorCode and message", () => {
    const error = {
      code: "weak_password",
      status: 422,
      message: "Password is too weak",
      // Fields that must never leak into a log line even if a future
      // Supabase SDK version adds them to AuthError.
      stack: "at Object.<anonymous> (/secret/path.ts:1:1)",
      cause: { rawRequestBody: "password=hunter2" }
    };

    const result = normalizeAuthError(error as never);

    assert.deepEqual(Object.keys(result).sort(), ["errorCode", "message"]);
  });
});

describe("logAuthEvent", () => {
  let originalWarn: typeof console.warn;
  let captured: string[];

  beforeEach(() => {
    captured = [];
    originalWarn = console.warn;
    console.warn = (line: string) => {
      captured.push(line);
    };
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  test("emits the requested level, event, and context fields", () => {
    logAuthEvent("warn", AUTH_EVENTS.signInFailed, {
      correlationId: "req-123",
      email: "user@example.com",
      errorCode: "invalid_credentials",
      message: "Invalid login credentials"
    });

    assert.equal(captured.length, 1);
    const entry = JSON.parse(captured[0]);
    assert.equal(entry.level, "warn");
    assert.equal(entry.event, "auth_sign_in_failed");
    assert.equal(entry.correlationId, "req-123");
    assert.equal(entry.email, "user@example.com");
    assert.equal(entry.errorCode, "invalid_credentials");
  });

  test("reserved fields (level, event, timestamp) cannot be overridden by context", () => {
    // AuthEventContext's type doesn't expose level/event/timestamp as
    // assignable keys at all -- this cast simulates a caller trying to
    // smuggle them in anyway, to prove the runtime protection in
    // logEvent (not just the type system) is what actually holds.
    const maliciousContext = { level: "info", event: "spoofed", timestamp: "1970-01-01" } as unknown as Parameters<
      typeof logAuthEvent
    >[2];

    logAuthEvent("warn", AUTH_EVENTS.signInFailed, maliciousContext);

    const entry = JSON.parse(captured[0]);
    assert.equal(entry.level, "warn");
    assert.equal(entry.event, "auth_sign_in_failed");
    assert.notEqual(entry.timestamp, "1970-01-01");
  });

  test("never requires a password or token field to exist in its context type", () => {
    // Compile-time guarantee, exercised here at runtime too: passing no
    // context at all is valid, and there is no field named password,
    // token, otp, or similar anywhere in what logAuthEvent accepts.
    logAuthEvent("warn", AUTH_EVENTS.protectedRouteDenied);
    assert.equal(captured.length, 1);
  });
});
