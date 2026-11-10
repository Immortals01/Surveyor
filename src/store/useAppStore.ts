import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, CelestialBody, LoRoMood, StoryTab } from "@/data/schema";
import type { QualityTier } from "@/lib/quality";
import {
  isHeightLoaded,
  setActiveHeightBody,
} from "@/scene/moon/heightSampler";
import { suspendInactiveTileManagers } from "@/scene/moon/tileManager";

export type { CelestialBody };
export type AppMode = "intro" | "tour" | "explore";

export interface ActiveDialogue {
  lineId: string;
  speaker: "loro" | "equipment";
  speakerLabel: string;
  text: string;
  sourceIds: string[];
  isRevealing: boolean;
  isSpeaking: boolean;
  holdForInteraction?: boolean;
}

export interface PersistedSettings {
  muted: boolean;
  voiceEnabled: boolean;
  captionsEnabled: boolean;
  reduceMotion: boolean;
  qualityTier: QualityTier | "auto";
}

export interface AppState {
  // Celestial body ("moon" | "earth" | "mars")
  celestialBody: CelestialBody;
  activeBody: CelestialBody;
  setCelestialBody: (body: CelestialBody) => void;
  setActiveBody: (body: CelestialBody) => void;

  // Primary experience state
  mode: AppMode;
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  activeStoryTab: StoryTab;
  issPanelOpen: boolean;

  // Guided Tour cursor
  tourChapterIndex: number;
  tourBeatIndex: number;
  tourPaused: boolean;
  chapterBannerVisible: boolean;

  // Explore filter state
  categoryFilter: Category | "all";
  heroOnly: boolean;
  siteIndexOpen: boolean;

  // Sources & credits modal
  sourcesDrawerOpen: boolean;
  highlightedSourceId: string | null;

  // Lo-Ro character & speech bubble
  loroMood: LoRoMood;
  dialogue: ActiveDialogue | null;

  // Scene & camera state
  sunLongitude: number; // degrees (-180..180)
  sunLatitude: number; // degrees (-25..25)
  cameraFlying: boolean;
  heightReady: boolean;

  // Persisted user preferences
  settings: PersistedSettings;

  // Actions
  setMode: (mode: AppMode) => void;
  setIssPanelOpen: (open: boolean) => void;
  startTour: (chapterIndex?: number) => void;
  enterExplore: (keepSelection?: boolean) => void;
  returnToIntro: () => void;
  setTourCursor: (chapterIndex: number, beatIndex: number) => void;
  setTourPaused: (paused: boolean) => void;
  setChapterBannerVisible: (visible: boolean) => void;
  selectSite: (siteId: string | null, tab?: StoryTab) => void;
  setHoveredSite: (siteId: string | null) => void;
  setActiveStoryTab: (tab: StoryTab) => void;
  setCategoryFilter: (cat: Category | "all") => void;
  setHeroOnly: (heroOnly: boolean) => void;
  setSiteIndexOpen: (open: boolean) => void;
  openSources: (sourceId?: string) => void;
  closeSources: () => void;
  setLoRoMood: (mood: LoRoMood) => void;
  setDialogue: (dialogue: ActiveDialogue | null) => void;
  patchDialogue: (patch: Partial<ActiveDialogue>) => void;
  setSunDirection: (lon: number, lat?: number) => void;
  setCameraFlying: (flying: boolean) => void;
  setHeightReady: (ready: boolean) => void;
  updateSettings: (patch: Partial<PersistedSettings>) => void;
}

function applyBodySwitch(s: AppState, body: CelestialBody): Partial<AppState> {
  if (s.celestialBody === body && s.activeBody === body) return s;
  setActiveHeightBody(body);
  suspendInactiveTileManagers(body);
  return {
    celestialBody: body,
    activeBody: body,
    heightReady: isHeightLoaded(body),
    mode: s.mode === "tour" ? "explore" : s.mode,
    selectedSiteId: null,
    hoveredSiteId: null,
    issPanelOpen: false,
    siteIndexOpen: false,
    categoryFilter: "all",
    heroOnly: false,
    tourChapterIndex: 0,
    tourBeatIndex: 0,
    tourPaused: true,
    chapterBannerVisible: false,
    sunLongitude: body === "mars" ? 18 : body === "earth" ? -55 : -48,
    sunLatitude: body === "mars" ? 8 : body === "earth" ? 12 : 1.5,
    loroMood: "waving",
    dialogue:
      s.mode === "intro"
        ? null
        : {
            lineId: `switch-body-${body}`,
            speaker: "loro",
            speakerLabel:
              body === "mars"
                ? "SURVEYOR 3 · DEEP-SPACE MARS RELAY"
                : body === "earth"
                  ? "SURVEYOR 3 · EARTH TELEMETRY LINK"
                  : "SURVEYOR 3 (1967)",
            text:
              body === "mars"
                ? "Deep-Space Network relay locked onto Mars! From Viking 1 and marathon rover Opportunity to Ingenuity's 72 flights and Perseverance's sample depot—click any marker to explore 29 Red Planet pioneers!"
                : body === "earth"
                  ? "Welcome home to Earth! Click any launch complex or Mission Control pin to see how many space missions started there—or click 'ISS LIVE' to track the International Space Station!"
                  : "Back in lunar orbit above my home crater! Click any glowing beacon on the Moon to visit 29 historic Apollo, Surveyor, Ranger, and Artemis hardware sites.",
            sourceIds:
              body === "mars"
                ? ["S-MOLA-MEGDR", "S-HIRISE-HARDWARE"]
                : body === "earth"
                  ? ["S-BLUE-MARBLE", "S-NASA-KSC", "S-NASA-ISS"]
                  : ["S-SVS-4720", "S-WAGNER-2017"],
            isRevealing: !s.settings.reduceMotion,
            isSpeaking: false,
          },
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      celestialBody: "moon",
      activeBody: "moon",
      setCelestialBody: (body) => set((s) => applyBodySwitch(s, body)),
      setActiveBody: (body) => set((s) => applyBodySwitch(s, body)),

      mode: "intro",
      selectedSiteId: null,
      hoveredSiteId: null,
      activeStoryTab: "story",
      issPanelOpen: false,

      tourChapterIndex: 0,
      tourBeatIndex: 0,
      tourPaused: false,
      chapterBannerVisible: false,

      categoryFilter: "all",
      heroOnly: false,
      siteIndexOpen: false,

      sourcesDrawerOpen: false,
      highlightedSourceId: null,

      loroMood: "waving",
      dialogue: null,

      sunLongitude: -48,
      sunLatitude: 1.5,
      cameraFlying: false,
      heightReady: false,

      settings: {
        muted: false,
        voiceEnabled: true,
        captionsEnabled: true,
        reduceMotion: false,
        qualityTier: "auto",
      },

      setMode: (mode) => set({ mode }),

      setIssPanelOpen: (issPanelOpen) =>
        set((s) => ({
          issPanelOpen,
          selectedSiteId: issPanelOpen ? null : s.selectedSiteId,
        })),

      startTour: (chapterIndex = 0) =>
        set({
          mode: "tour",
          tourChapterIndex: chapterIndex,
          tourBeatIndex: 0,
          tourPaused: false,
          siteIndexOpen: false,
          issPanelOpen: false,
          chapterBannerVisible: true,
          categoryFilter: "all",
          heroOnly: false,
        }),

      enterExplore: (keepSelection = true) =>
        set((s) => ({
          mode: "explore",
          tourPaused: true,
          chapterBannerVisible: false,
          selectedSiteId: keepSelection ? s.selectedSiteId : null,
          issPanelOpen: keepSelection ? s.issPanelOpen : false,
          loroMood: "waving",
        })),

      returnToIntro: () =>
        set((s) => ({
          mode: "intro",
          tourPaused: true,
          chapterBannerVisible: false,
          selectedSiteId: null,
          hoveredSiteId: null,
          issPanelOpen: false,
          dialogue: null,
          loroMood: "waving",
          siteIndexOpen: false,
          sunLongitude:
            s.celestialBody === "mars"
              ? 18
              : s.celestialBody === "earth"
                ? -55
                : -48,
          sunLatitude:
            s.celestialBody === "mars"
              ? 8
              : s.celestialBody === "earth"
                ? 12
                : 1.5,
        })),

      setTourCursor: (chapterIndex, beatIndex) =>
        set({ tourChapterIndex: chapterIndex, tourBeatIndex: beatIndex }),

      setTourPaused: (tourPaused) => set({ tourPaused }),

      setChapterBannerVisible: (chapterBannerVisible) =>
        set({ chapterBannerVisible }),

      selectSite: (siteId, tab) =>
        set((s) => ({
          selectedSiteId: siteId,
          issPanelOpen: siteId !== null ? false : s.issPanelOpen,
          activeStoryTab: tab ?? (siteId !== s.selectedSiteId ? "story" : s.activeStoryTab),
        })),

      setHoveredSite: (hoveredSiteId) => set({ hoveredSiteId }),

      setActiveStoryTab: (activeStoryTab) => set({ activeStoryTab }),

      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

      setHeroOnly: (heroOnly) => set({ heroOnly }),

      setSiteIndexOpen: (siteIndexOpen) => set({ siteIndexOpen }),

      openSources: (sourceId) =>
        set({
          sourcesDrawerOpen: true,
          highlightedSourceId: sourceId ?? null,
        }),

      closeSources: () =>
        set({ sourcesDrawerOpen: false, highlightedSourceId: null }),

      setLoRoMood: (loroMood) => set({ loroMood }),

      setDialogue: (dialogue) => set({ dialogue }),

      patchDialogue: (patch) =>
        set((s) =>
          s.dialogue ? { dialogue: { ...s.dialogue, ...patch } } : {},
        ),

      setSunDirection: (sunLongitude, sunLatitude) =>
        set((s) => ({
          sunLongitude,
          sunLatitude: sunLatitude ?? s.sunLatitude,
        })),

      setCameraFlying: (cameraFlying) => set({ cameraFlying }),

      setHeightReady: (heightReady) => set({ heightReady }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "abandoned-not-forgotten-settings-v2",
      partialize: (state) => ({ settings: state.settings }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        return {
          ...currentState,
          settings: {
            ...currentState.settings,
            ...persisted?.settings,
            reduceMotion: false,
          },
        };
      },
    },
  ),
);
