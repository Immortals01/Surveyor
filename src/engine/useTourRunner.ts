import { useCallback, useEffect, useRef } from "react";
import { cancelSpeech, speakLine } from "@/audio/speech";
import { getTourChaptersForBody, SITE_BY_ID } from "@/data";
import { resolveHostLine } from "@/data/host";
import { getHost, resolveHostForSite } from "@/data/hosts";
import type { DialogueLine } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";
import { cameraBus } from "./camera";
import { getActiveBeat, tourReducer, type TourEvent } from "./tourEngine";

/**
 * Bridges the pure Guided Tour cursor in useAppStore with camera flights,
 * sun terminator shifts, story drawer selection, and voice/caption playback.
 */
export function useTourRunner() {
  const mode = useAppStore((s) => s.mode);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const chapterIndex = useAppStore((s) => s.tourChapterIndex);
  const beatIndex = useAppStore((s) => s.tourBeatIndex);
  const tourPaused = useAppStore((s) => s.tourPaused);

  const prevChapterRef = useRef<number>(-1);

  const dispatchTour = useCallback((event: TourEvent) => {
    const store = useAppStore.getState();
    const chapters = getTourChaptersForBody(store.celestialBody);
    const next = tourReducer(
      {
        active: store.mode === "tour",
        chapterIndex: store.tourChapterIndex,
        beatIndex: store.tourBeatIndex,
        paused: store.tourPaused,
        completed: false,
      },
      event,
      chapters,
    );

    if (!next.active) {
      cancelSpeech();
      if (next.completed) {
        store.setTourComplete(true);
        store.enterExplore(false);
      } else {
        store.enterExplore(true);
      }
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
  }, [mode, chapterIndex, celestialBody]);

  // Execute active beat with strict AbortController cancellation (manual progression only)
  useEffect(() => {
    if (mode !== "tour" || tourPaused) {
      cancelSpeech();
      return;
    }

    const chapters = getTourChaptersForBody(celestialBody);
    const beat = getActiveBeat(chapters, { chapterIndex, beatIndex });
    if (!beat) return;

    const controller = new AbortController();
    const { signal } = controller;

    const activateLine = (line: DialogueLine) => {
      const store = useAppStore.getState();
      store.setLoRoMood(line.mood);
      store.setDialogue({
        lineId: line.id,
        speaker: line.speaker,
        speakerLabel:
          line.speakerLabel ??
          (line.speaker === "loro"
            ? store.celestialBody === "mars"
              ? "SURVEYOR 3 · DEEP-SPACE MARS RELAY"
              : "SURVEYOR 3"
            : "MEMORY LOG"),
        text: line.text,
        sourceIds: line.sourceIds,
        isRevealing: !store.settings.reduceMotion,
        isSpeaking: true,
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
        if (beat.reprise) {
          // Legacy stop: return to the site without reopening its dossier.
          store.selectSite(null);
        } else {
          store.selectSite(site.id);
        }
        store.setActiveHost(resolveHostForSite(site.id));

        // Every site gets a voice. When the site has its own host character,
        // prefer that character's first-person intro over Surveyor 3's
        // third-person site line, so the text and the speaking host agree.
        const siteHost = getHost(resolveHostForSite(site.id));
        const isOwnHost = siteHost.siteId === site.id;
        const isDefaultSiteIntro =
          site.tier === "hero" &&
          beat.announce?.id === site.loroIntro.id;
        const hostLine =
          isOwnHost && isDefaultSiteIntro
            ? siteHost.intro
            : (beat.announce ??
              resolveHostLine(
                site,
                siteHost,
                store.celestialBody === "mars",
              ));
        activateLine(hostLine);
        await Promise.all([
          cameraBus.flyToLatLon(site.lat, site.lon),
          speakLine(hostLine, signal),
        ]);

        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        return;
      }

      if (beat.kind === "flyOverview") {
        if (beat.sunLon !== undefined) {
          store.setSunDirection(beat.sunLon);
        }
        store.setLoRoMood("scanning");
        if (beat.announce) {
          activateLine(beat.announce);
          await Promise.all([
            cameraBus.flyOverview(beat.lat, beat.lon, beat.distance),
            speakLine(beat.announce, signal),
          ]);
        } else {
          await cameraBus.flyOverview(beat.lat, beat.lon, beat.distance);
        }
        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        return;
      }

      if (beat.kind === "speak") {
        if (beat.siteId) {
          store.setActiveHost(resolveHostForSite(beat.siteId));
        }
        if (beat.siteId && store.selectedSiteId !== null) {
          store.selectSite(beat.siteId);
        }
        activateLine(beat.line);
        await speakLine(beat.line, signal);
        if (signal.aborted) return;
        store.patchDialogue({ isSpeaking: false, isRevealing: false });
        return;
      }
    };

    void runBeat();

    return () => {
      controller.abort();
      cancelSpeech();
    };
  }, [mode, celestialBody, chapterIndex, beatIndex, tourPaused]);

  return { dispatchTour };
}
