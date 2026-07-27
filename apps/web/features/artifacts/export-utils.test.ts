import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { sanitizeFilename } from "./export-utils.ts";

describe("sanitizeFilename", () => {
  test("lowercases and hyphenates a normal title", () => {
    assert.equal(sanitizeFilename("Q3 Marketing Brief"), "q3-marketing-brief");
  });

  test("strips characters that aren't alphanumeric or hyphens", () => {
    assert.equal(sanitizeFilename("Draft: v2 (final)!"), "draft-v2-final");
  });

  test("collapses runs of non-alphanumeric characters into one hyphen", () => {
    assert.equal(sanitizeFilename("a   b---c"), "a-b-c");
  });

  test("trims leading and trailing hyphens", () => {
    assert.equal(sanitizeFilename("--- leading and trailing ---"), "leading-and-trailing");
  });

  test("falls back to 'artifact' when nothing usable remains", () => {
    assert.equal(sanitizeFilename("!!! ??? ..."), "artifact");
    assert.equal(sanitizeFilename(""), "artifact");
    assert.equal(sanitizeFilename("   "), "artifact");
  });

  test("truncates to the maximum filename length", () => {
    const longTitle = "a".repeat(200);
    const result = sanitizeFilename(longTitle);
    assert.equal(result.length, 80);
  });
});
