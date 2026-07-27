import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildRateLimitKey, hashIdentifier } from "./rate-limit-key.ts";

describe("hashIdentifier", () => {
  test("is deterministic for the same input", () => {
    assert.equal(hashIdentifier("user@example.com"), hashIdentifier("user@example.com"));
  });

  test("normalizes case and surrounding whitespace before hashing", () => {
    assert.equal(hashIdentifier("User@Example.com"), hashIdentifier("  user@example.com  "));
  });

  test("never returns the plaintext input", () => {
    const hashed = hashIdentifier("user@example.com");
    assert.notEqual(hashed, "user@example.com");
    assert.ok(!hashed.includes("user@example.com"));
  });

  test("different inputs produce different hashes", () => {
    assert.notEqual(hashIdentifier("user-a@example.com"), hashIdentifier("user-b@example.com"));
  });
});

describe("buildRateLimitKey", () => {
  test("combines action, kind, and hashed identifier", () => {
    const key = buildRateLimitKey("sign_in", "email", "user@example.com");
    const parts = key.split(":");

    assert.equal(parts[0], "sign_in");
    assert.equal(parts[1], "email");
    assert.equal(parts[2], hashIdentifier("user@example.com"));
  });

  test("never embeds the raw identifier in the key", () => {
    const key = buildRateLimitKey("sign_up", "ip", "203.0.113.42");
    assert.ok(!key.includes("203.0.113.42"));
  });

  test("the same identifier under a different action produces a different key", () => {
    const signIn = buildRateLimitKey("sign_in", "email", "user@example.com");
    const signUp = buildRateLimitKey("sign_up", "email", "user@example.com");
    assert.notEqual(signIn, signUp);
  });
});
