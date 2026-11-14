import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "bun:test";
import {
  MACHINES,
  MACHINE_BY_ID,
  MACHINE_TABS,
  getStoryText,
  getStoryWordCount,
} from "./machines";
import { SITE_BY_ID, SOURCES_BY_ID } from "./index";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

describe("machine cast content package", () => {
  it("contains nine unique machines with first-person stories", () => {
    expect(MACHINES).toHaveLength(9);
    expect(new Set(MACHINES.map((m) => m.id)).size).toBe(9);
    expect(MACHINE_BY_ID.size).toBe(9);

    for (const machine of MACHINES) {
      const text = getStoryText(machine);
      expect(text.startsWith("Hi") || text.startsWith("I") || text.startsWith("We")).toBe(true);
      expect(text.toLowerCase().endsWith("abandoned but not forgotten.")).toBe(true);
      expect(text).toContain("I");
    }
  });

  it("keeps every story inside the 150–250 word range", () => {
    for (const machine of MACHINES) {
      const words = getStoryWordCount(machine);
      expect(words, `${machine.id} has ${words} words`).toBeGreaterThanOrEqual(150);
      expect(words, `${machine.id} has ${words} words`).toBeLessThanOrEqual(250);
    }
  });

  it("resolves every source, site, gallery and link", () => {
    for (const machine of MACHINES) {
      for (const sourceId of machine.sourceIds) {
        expect(SOURCES_BY_ID.has(sourceId), `${machine.id} missing ${sourceId}`).toBe(true);
      }
      for (const link of machine.links) {
        if (link.sourceId) {
          expect(SOURCES_BY_ID.has(link.sourceId), `${machine.id} link missing ${link.sourceId}`).toBe(true);
        }
        expect(link.url.startsWith("https://")).toBe(true);
      }
      if (machine.siteId) {
        expect(SITE_BY_ID.has(machine.siteId), `${machine.id} missing site ${machine.siteId}`).toBe(true);
      } else {
        expect(machine.body).toBe("belt");
      }
      for (const image of machine.gallery) {
        expect(image.credit.length).toBeGreaterThan(0);
        expect(image.src.startsWith("/images/machines/")).toBe(true);
        expect(existsSync(path.join(PUBLIC_DIR, image.src)), `${machine.id} missing ${image.src}`).toBe(true);
      }
    }
  });

  it("gives every character a distinct voice profile", () => {
    const voices = MACHINES.map((m) => m.voice.voiceId);
    expect(new Set(voices).size).toBe(MACHINES.length);
    for (const machine of MACHINES) {
      expect(machine.voice.voiceId).toMatch(/^[a-z]{2}-[A-Z]{2}-/);
      expect(machine.voice.webSpeechHints.length).toBeGreaterThan(0);
      expect(machine.voice.personality.length).toBeGreaterThan(10);
    }
  });

  it("has a well-formed story, timeline, facts and audio path for every machine", () => {
    const sentenceIds = new Set<string>();
    for (const machine of MACHINES) {
      expect(machine.story.length).toBeGreaterThanOrEqual(7);
      for (const sentence of machine.story) {
        expect(sentenceIds.has(sentence.id)).toBe(false);
        sentenceIds.add(sentence.id);
        expect(sentence.audio).toBe(`/audio/machines/${sentence.id}.mp3`);
        expect(existsSync(path.join(PUBLIC_DIR, sentence.audio)), `${machine.id} missing ${sentence.audio}`).toBe(true);
        expect(sentence.text.trim().length).toBeGreaterThan(20);
      }
      expect(machine.timeline.length).toBeGreaterThanOrEqual(3);
      expect(machine.facts.length).toBeGreaterThanOrEqual(3);
      expect(machine.purpose.instruments.length).toBeGreaterThanOrEqual(2);
      expect(machine.purpose.discoveries.length).toBeGreaterThanOrEqual(2);
    }
    expect(MACHINE_TABS.map((t) => t.id)).toEqual(["story", "science", "pictures", "facts", "more"]);
  });
});
