import { describe, expect, it } from "bun:test";
import { DEEP_SPACE_ENTRIES } from "./deepSpace";
import { SOURCES_BY_ID } from "./sources";

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

  it("cites at least one ledger source for every object", () => {
    for (const entry of DEEP_SPACE_ENTRIES) {
      expect(entry.sourceIds.length, `${entry.id} has no sources`).toBeGreaterThanOrEqual(1);
      for (const sid of entry.sourceIds) {
        expect(SOURCES_BY_ID.has(sid), `${entry.id} cites unknown source ${sid}`).toBe(
          true,
        );
      }
    }
  });
});
