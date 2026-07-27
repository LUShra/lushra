import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_REDIRECT_PATH, getAppOrigin, getSafeRedirectPath } from "./redirects.ts";

describe("getSafeRedirectPath", () => {
  test("returns the default for a missing candidate", () => {
    assert.equal(getSafeRedirectPath(null), DEFAULT_REDIRECT_PATH);
    assert.equal(getSafeRedirectPath(undefined), DEFAULT_REDIRECT_PATH);
    assert.equal(getSafeRedirectPath(""), DEFAULT_REDIRECT_PATH);
  });

  test("allows a genuine internal path, preserving its query string", () => {
    assert.equal(getSafeRedirectPath("/workspace/projects"), "/workspace/projects");
    assert.equal(getSafeRedirectPath("/workspace/search?q=brief"), "/workspace/search?q=brief");
  });

  test("rejects an absolute external URL", () => {
    assert.equal(getSafeRedirectPath("https://evil.example/phish"), DEFAULT_REDIRECT_PATH);
    assert.equal(getSafeRedirectPath("http://evil.example"), DEFAULT_REDIRECT_PATH);
  });

  test("rejects a protocol-relative URL (the //host open-redirect trick)", () => {
    assert.equal(getSafeRedirectPath("//evil.example"), DEFAULT_REDIRECT_PATH);
    assert.equal(getSafeRedirectPath("///evil.example"), DEFAULT_REDIRECT_PATH);
  });

  test("rejects an embedded scheme like javascript:", () => {
    assert.equal(getSafeRedirectPath("javascript:alert(1)"), DEFAULT_REDIRECT_PATH);
  });

  test("rejects a path that would return to an /auth route", () => {
    assert.equal(getSafeRedirectPath("/auth/sign-in"), DEFAULT_REDIRECT_PATH);
    assert.equal(getSafeRedirectPath("/auth/update-password"), DEFAULT_REDIRECT_PATH);
  });

  test("rejects a value that fails to parse as a URL entirely", () => {
    assert.equal(getSafeRedirectPath("http://"), DEFAULT_REDIRECT_PATH);
  });
});

describe("getAppOrigin", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  function restoreEnv() {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }

    if (originalVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = originalVercelUrl;
    }
  }

  test("prefers NEXT_PUBLIC_APP_URL, trimming a trailing slash", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://lushra.example/";
    delete process.env.VERCEL_URL;

    try {
      assert.equal(await getAppOrigin(), "https://lushra.example");
    } finally {
      restoreEnv();
    }
  });

  test("falls back to VERCEL_URL when NEXT_PUBLIC_APP_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = "lushra-preview-123.vercel.app";

    try {
      assert.equal(await getAppOrigin(), "https://lushra-preview-123.vercel.app");
    } finally {
      restoreEnv();
    }
  });

  test("falls back to localhost when neither is set -- never the request Host header", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;

    try {
      assert.equal(await getAppOrigin(), "http://localhost:3000");
    } finally {
      restoreEnv();
    }
  });
});
