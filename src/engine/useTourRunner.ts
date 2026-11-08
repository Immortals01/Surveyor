import { useCallback, useEffect, useRef } from "react";
import { cancelSpeech, speakLine } from "@/audio/speech";
import { SITE_BY_ID, TOUR_CHAPTERS } from "@/data";
import type { DialogueLine } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";
import { cameraBus } from "./camera";
import { getActiveBeat, tourReducer, type TourEvent } from "./tourEngine";

/**
 * Bridges the pure Guided Tour cursor in useAppStore with camera flights,
 * sun terminator shifts, story drawer tabs, and voice/caption playback.
 */
export function useTourRunner() {
  const mode = useAppStore((s) => s.mode);
  const chapterIndex = useAppStore((s) => s.tourChapterIndex);
  const beatIndex = useAppStore((s) => s.tourBeatIndex);
  const tourPaused = useAppStore((s) => s.tourPaused);

  const prevChapterRef = useRef<number>(-1);

  const dispatchTour = useCallback((event: TourEvent) => {
    const store = useAppStore.getState();
    const next = tourReducer(
      {
        active: store.mode === "tour",
        chapterIndex: store.tourChapterIndex,
        beatIndex: store.tourBeatIndex,
        paused: store.tourPaused,
        completed: false,
      },
      event,
      TOUR_CHAPTERS,
    );

    if (!next.active) {
      cancelSpeech();
      store.enterExplore(true);
      return;
    }

    const chapterChanged = next.chapterIndex !== store.tourChapterIndex;
    store.setTourPaused(next.paused);
    store.setTourCursor(next.chapterIndex, next.beatIndex);
    if (chapterChanged) {
      store.setChapterBannerVisible(true);
    }
  }, []);

  // Show chapter banner briefly on chapter start
  useEffect(() => {
    if (mode !== "tour") {
      prevChapterRef.current = -1;
      return;
    }
    if (prevChapterRef.current !== chapterIndex) {
      prevChapterRef.current = chapterIndex;
      useAppStore.getState().setChapterBannerVisible(true);
      const timer = window.setTimeout(() => {
        useAppStore.getState().setChapterBannerVisible(false);
      }, 2400);
      return () => window.clearTimeout(timer);
    }
  }, [mode, chapterIndex]);

  // Execute active beat with strict AbortController cancellation
  useEffect(() => {
    if (mode !== "tour" || tourPaused) {
      cancelSpeech();
      return;
    }

    const beat = getActiveBeat(TOUR_CHAPTERS, { chapterIndex, beatIndex });
    if (!beat) return;

    const controller = new AbortController();
    const { signal } = controller;

    const activateLine = (line: DialogueLine, hold = false) => {
      const store = useAppStore.getState();
      store.setLoRoMood(line.mood);
      store.setDialogue({
        lineId: line.id,
        speaker: line.speaker,
        speakerLabel:
          line.speakerLabel ??
          (line.speaker === "loro" ? "LO-RO // ORBITAL GUIDE" : "MEMORY LOG"),
        text: line.text,
        sourceIds: line.sourceIds,
        isRevealing: !store.settings.reduceMotion,
        isSpeaking: true,
        holdForInteraction: hold,
      });
    };

    const runBeat = async () => {
      const store = useAppStore.getState();

      if (beat.kind === "flySite") {
        const site = SITE_BY_ID.get(beat.siteId);
        if (!site) return;

        if (beat.sunLon !== undefined) {
          store.setSunDirection(beat.sunLon, beat.sunLat);
        }
        store.setLoRoMood("scanning");
        store.selectSite(site.id, beat.openTab ?? "story");

        if (beat.announce) {
          activateLine(beat.announce, false);
          await Promise.all([
            cameraBus.flyToLatLon(site.lat, site.lon),
            speakLine(beat.announce, signal),
          ]);
        } else {
          await cameraBus.flyToLatLon(site.lat, site.lon);
        }

        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        await pauseGap(650, signal);
        if (!signal.aborted) {
          dispatchTour({ type: "BEAT_AUTO_COMPLETED" });
        }
        return;
      }

      if (beat.kind === "flyOverview") {
        if (beat.sunLon !== undefined) {
          store.setSunDirection(beat.sunLon);
        }
        store.setLoRoMood("scanning");
        if (beat.announce) {
          activateLine(beat.announce, false);
          await Promise.all([
            cameraBus.flyOverview(beat.lat, beat.lon, beat.distance),
            speakLine(beat.announce, signal),
          ]);
        } else {
          await cameraBus.flyOverview(beat.lat, beat.lon, beat.distance);
        }
        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        await pauseGap(500, signal);
        if (!signal.aborted) {
          dispatchTour({ type: "BEAT_AUTO_COMPLETED" });
        }
        return;
      }

      if (beat.kind === "speak") {
        if (beat.siteId) {
          store.selectSite(beat.siteId, beat.openTab);
        } else if (beat.openTab && store.selectedSiteId) {
          store.setActiveStoryTab(beat.openTab);
        }
        activateLine(beat.line, false);
        await speakLine(beat.line, signal);
        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        await pauseGap(750, signal);
        if (!signal.aborted) {
          dispatchTour({ type: "BEAT_AUTO_COMPLETED" });
        }
        return;
      }

      if (beat.kind === "spotlightWidget") {
        store.selectSite(beat.siteId, "science");
        activateLine(beat.promptLine, true);
        await speakLine(beat.promptLine, signal);
        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        // Holds here intentionally until user clicks Next!
      }
    };

    void runBeat();

    return () => {
      controller.abort();
      cancelSpeech();
    };
  }, [mode, chapterIndex, beatIndex, tourPaused, dispatchTour]);

  return { dispatchTour };
}

function pauseGap(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });
}
