import { describe, expect, it } from "bun:test";
import { DEEP_SPACE_ENTRIES } from "@/data/deepSpace";
import {
  DEEP_SPACE_VOICES,
  deepSpaceParagraphAudio,
  deepSpaceParagraphDomId,
  deepSpaceVoiceFor,
} from "./deepSpaceVoices";

describe("deep space narration voices", () => {
  it("gives every object its own voice profile", () => {
    for (const entry of DEEP_SPACE_ENTRIES) {
      const voice = DEEP_SPACE_VOICES[entry.id];
      expect(voice, `${entry.id} has no voice profile`).toBeDefined();
      expect(voice.voiceId).toMatch(/^[a-z]{2}-[A-Z]{2}-\w+Neural$/);
      expect(voice.webSpeechHints.length).toBeGreaterThanOrEqual(1);
      expect(voice.pauseMs).toBeGreaterThanOrEqual(0);
      expect(voice.pauseMs).toBeLessThanOrEqual(1200);
      expect(voice.webRate).toBeGreaterThan(0.5);
      expect(voice.webRate).toBeLessThan(1.6);
    }
  });

  it("falls back to a working profile for unknown objects", () => {
    const voice = deepSpaceVoiceFor("not-a-real-object");
    expect(voice.voiceId.length).toBeGreaterThan(0);
  });

  it("addresses one clip and one anchor per memory-log paragraph", () => {
    for (const entry of DEEP_SPACE_ENTRIES) {
      const paths = entry.story.map((_, index) =>
        deepSpaceParagraphAudio(entry.id, index),
      );
      const ids = entry.story.map((_, index) => deepSpaceParagraphDomId(entry.id, index));
      expect(new Set(paths).size, `${entry.id} duplicate clip paths`).toBe(paths.length);
      expect(new Set(ids).size, `${entry.id} duplicate anchors`).toBe(ids.length);
      expect(paths[0]).toContain(`/audio/deep-space/${entry.id}-p1.mp3`);
    }
  });
});
