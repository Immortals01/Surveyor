import { describe, expect, it } from "bun:test";
import { DEEP_SPACE_ENTRIES } from "./deepSpace";

describe("deep space memory files", () => {
  it("gives every object a complete first-person story and flight record", () => {
    expect(DEEP_SPACE_ENTRIES.length).toBe(4);
    for (const entry of DEEP_SPACE_ENTRIES) {
      expect(entry.story.length, `${entry.id} paragraphs`).toBeGreaterThanOrEqual(3);
      const words = entry.story.join(" ").split(/\s+/).filter(Boolean).length;
      expect(words, `${entry.id} word count`).toBeGreaterThanOrEqual(140);
      expect(words, `${entry.id} word count`).toBeLessThanOrEqual(260);
      expect(entry.facts.length, `${entry.id} facts`).toBeGreaterThanOrEqual(4);
      expect(entry.images.length, `${entry.id} images`).toBeGreaterThanOrEqual(3);
    }
  });
});
