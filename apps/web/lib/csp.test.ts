import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildContentSecurityPolicy, generateNonce } from "./csp.ts";

describe("generateNonce", () => {
  test("produces a different value on each call", () => {
    assert.notEqual(generateNonce(), generateNonce());
  });

  test("is base64-encoded (no CSP-delimiter characters)", () => {
    const nonce = generateNonce();
    assert.ok(!/[;,\s'"]/.test(nonce));
  });
});

describe("buildContentSecurityPolicy", () => {
  test("embeds the given nonce in script-src", () => {
    const policy = buildContentSecurityPolicy("abc123", false);
    assert.ok(policy.includes("'nonce-abc123'"));
  });

  test("never contains a wildcard source", () => {
    const policy = buildContentSecurityPolicy("abc123", false);
    assert.ok(!policy.includes("*"));
  });

  test("locks down object-src, base-uri, frame-ancestors, and form-action", () => {
    const policy = buildContentSecurityPolicy("abc123", false);
    assert.ok(policy.includes("object-src 'none'"));
    assert.ok(policy.includes("base-uri 'self'"));
    assert.ok(policy.includes("frame-ancestors 'none'"));
    assert.ok(policy.includes("form-action 'self'"));
  });

  test("omits 'unsafe-eval' in production", () => {
    const policy = buildContentSecurityPolicy("abc123", false);
    assert.ok(!policy.includes("unsafe-eval"));
  });

  test("includes 'unsafe-eval' only in development, for Fast Refresh", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    assert.ok(policy.includes("'unsafe-eval'"));
  });

  test("each directive is separated and none is empty", () => {
    const policy = buildContentSecurityPolicy("abc123", false);
    const directives = policy.split("; ");
    assert.ok(directives.length > 5);
    directives.forEach((directive) => assert.ok(directive.trim().length > 0));
  });
});
