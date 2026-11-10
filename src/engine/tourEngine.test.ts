import { describe, expect, it } from "bun:test";
import type { TourChapter } from "@/data/schema";
import { createInitialTourState, tourReducer } from "./tourEngine";

const MOCK_CHAPTERS: TourChapter[] = [
  {
    id: "ch-1",
    number: 1,
    title: "Ch 1",
    shortTitle: "1",
    subtitle: "Sub 1",
    heroSiteIds: ["ranger-7"],
    beats: [
      { kind: "flySite", siteId: "ranger-7" },
      {
        kind: "speak",
        siteId: "apollo-11",
        line: {
          id: "p1",
          speaker: "loro",
          mood: "excited",
          text: "Welcome to Tranquility Base!",
          sourceIds: [],
        },
      },
    ],
  },
  {
    id: "ch-2",
    number: 2,
    title: "Ch 2",
    shortTitle: "2",
    subtitle: "Sub 2",
    heroSiteIds: ["apollo-17-lrv"],
    beats: [
      { kind: "flySite", siteId: "apollo-17-lrv" },
      {
        kind: "speak",
        line: {
          id: "s2",
          speaker: "loro",
          mood: "waving",
          text: "Finale!",
          sourceIds: [],
        },
      },
    ],
  },
];

describe("tourReducer state machine", () => {
  it("starts a requested chapter at beat 0", () => {
    const s0 = createInitialTourState();
    const s1 = tourReducer(
      s0,
      { type: "START_CHAPTER", chapterIndex: 1 },
      MOCK_CHAPTERS,
    );
    expect(s1.active).toBe(true);
    expect(s1.chapterIndex).toBe(1);
    expect(s1.beatIndex).toBe(0);
  });

  it("advances across beats and chapters on BEAT_AUTO_COMPLETED and NEXT_BEAT", () => {
    let s = tourReducer(
      createInitialTourState(),
      { type: "START_CHAPTER", chapterIndex: 0 },
      MOCK_CHAPTERS,
    );
    // Beat 0 (flySite) auto-completes -> moves to Beat 1
    s = tourReducer(s, { type: "BEAT_AUTO_COMPLETED" }, MOCK_CHAPTERS);
    expect(s.beatIndex).toBe(1);

    // Explicit NEXT_BEAT advances into Chapter 2 Beat 0
    const next = tourReducer(
      s,
      { type: "NEXT_BEAT" },
      MOCK_CHAPTERS,
    );
    expect(next.chapterIndex).toBe(1);
    expect(next.beatIndex).toBe(0);
  });

  it("steps backward across chapter boundaries and finishes cleanly after final beat", () => {
    let s = tourReducer(
      createInitialTourState(),
      { type: "START_CHAPTER", chapterIndex: 1 },
      MOCK_CHAPTERS,
    );
    const back = tourReducer(s, { type: "PREV_BEAT" }, MOCK_CHAPTERS);
    expect(back.chapterIndex).toBe(0);
    expect(back.beatIndex).toBe(1);

    // Advance to end of chapter 2
    s = tourReducer(s, { type: "NEXT_BEAT" }, MOCK_CHAPTERS);
    expect(s.chapterIndex).toBe(1);
    expect(s.beatIndex).toBe(1);

    const done = tourReducer(s, { type: "NEXT_BEAT" }, MOCK_CHAPTERS);
    expect(done.active).toBe(false);
    expect(done.completed).toBe(true);
  });
});
