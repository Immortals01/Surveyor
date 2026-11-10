import type { TourBeat, TourChapter } from "@/data/schema";

export interface TourEngineState {
  active: boolean;
  chapterIndex: number;
  beatIndex: number;
  paused: boolean;
  completed: boolean;
}

export type TourEvent =
  | { type: "START_CHAPTER"; chapterIndex: number }
  | { type: "NEXT_BEAT" }
  | { type: "PREV_BEAT" }
  | { type: "BEAT_AUTO_COMPLETED" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "EXIT_TO_EXPLORE" };

export function createInitialTourState(): TourEngineState {
  return {
    active: false,
    chapterIndex: 0,
    beatIndex: 0,
    paused: false,
    completed: false,
  };
}

export function getActiveBeat(
  chapters: readonly TourChapter[],
  state: Pick<TourEngineState, "chapterIndex" | "beatIndex">,
): TourBeat | null {
  const ch = chapters[state.chapterIndex];
  if (!ch) return null;
  return ch.beats[state.beatIndex] ?? null;
}

/**
 * Pure deterministic Guided Tour state reducer (100% unit-tested without WebGL/DOM).
 */
export function tourReducer(
  state: TourEngineState,
  event: TourEvent,
  chapters: readonly TourChapter[],
): TourEngineState {
  if (chapters.length === 0) {
    return { ...state, active: false };
  }

  switch (event.type) {
    case "START_CHAPTER": {
      const idx = Math.max(0, Math.min(chapters.length - 1, event.chapterIndex));
      return {
        active: true,
        chapterIndex: idx,
        beatIndex: 0,
        paused: false,
        completed: false,
      };
    }

    case "PAUSE":
      return { ...state, paused: true };

    case "RESUME":
      return { ...state, paused: false };

    case "EXIT_TO_EXPLORE":
      return { ...state, active: false, paused: true };

    case "BEAT_AUTO_COMPLETED": {
      if (!state.active || state.paused) return state;
      return stepForward(state, chapters);
    }

    case "NEXT_BEAT": {
      if (!state.active) return state;
      return stepForward({ ...state, paused: false }, chapters);
    }

    case "PREV_BEAT": {
      if (!state.active) return state;
      if (state.beatIndex > 0) {
        return {
          ...state,
          beatIndex: state.beatIndex - 1,
          paused: false,
          completed: false,
        };
      }
      if (state.chapterIndex > 0) {
        const prevChIdx = state.chapterIndex - 1;
        const prevCh = chapters[prevChIdx]!;
        return {
          ...state,
          chapterIndex: prevChIdx,
          beatIndex: Math.max(0, prevCh.beats.length - 1),
          paused: false,
          completed: false,
        };
      }
      return { ...state, beatIndex: 0, paused: false };
    }
  }
}

function stepForward(
  state: TourEngineState,
  chapters: readonly TourChapter[],
): TourEngineState {
  const ch = chapters[state.chapterIndex];
  if (!ch) return { ...state, active: false, completed: true };

  if (state.beatIndex + 1 < ch.beats.length) {
    return {
      ...state,
      beatIndex: state.beatIndex + 1,
      completed: false,
    };
  }

  if (state.chapterIndex + 1 < chapters.length) {
    return {
      ...state,
      chapterIndex: state.chapterIndex + 1,
      beatIndex: 0,
      completed: false,
    };
  }

  // Reached end of Chapter 5 -> transition cleanly to Free Explore!
  return {
    ...state,
    active: false,
    paused: true,
    completed: true,
  };
}
