import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, LoRoMood, StoryTab } from "@/data/schema";
import type { QualityTier } from "@/lib/quality";

export type AppMode = "intro" | "tour" | "explore";
export type CelestialBody = "moon" | "earth";

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

export interface UserSettings {
  muted: boolean;
  voiceEnabled: boolean;
  captionsEnabled: boolean;
  reduceMotion: boolean;
  qualityTier: QualityTier | "auto";
}

export interface AppState {
  activeBody: CelestialBody;
  mode: AppMode;
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  activeStoryTab: StoryTab;
  issPanelOpen: boolean;

  categoryFilter: Category | "all";
  heroOnly: boolean;
  siteIndexOpen: boolean;
  sunLongitude: number;
  sunLatitude: number;
  heightReady: boolean;

  loroMood: LoRoMood;
  dialogue: ActiveDialogue | null;

  tourChapterIndex: number;
  tourBeatIndex: number;
  tourPaused: boolean;
  chapterBannerVisible: boolean;
  isCameraFlying: boolean;

  sourcesDrawerOpen: boolean;
  highlightedSourceId: string | null;
  settings: UserSettings;

  // Actions
  setActiveBody: (body: CelestialBody) => void;
  setIssPanelOpen: (open: boolean) => void;
  startTour: (chapterIndex?: number) => void;
  setTourCursor: (chapterIndex: number, beatIndex: number) => void;
  setTourPaused: (paused: boolean) => void;
  setChapterBannerVisible: (visible: boolean) => void;
  enterExplore: (keepSelection?: boolean) => void;
  returnToIntro: () => void;

  selectSite: (siteId: string | null, tab?: StoryTab) => void;
  setActiveStoryTab: (tab: StoryTab) => void;
  setHoveredSite: (siteId: string | null) => void;
  setCategoryFilter: (cat: Category | "all") => void;
  setHeroOnly: (heroOnly: boolean) => void;
  setSiteIndexOpen: (open: boolean) => void;

  setSunDirection: (lon: number, lat?: number) => void;
  setHeightReady: (ready: boolean) => void;
  setCameraFlying: (flying: boolean) => void;

  setLoRoMood: (mood: LoRoMood) => void;
  setDialogue: (dialogue: ActiveDialogue | null) => void;
  patchDialogue: (patch: Partial<ActiveDialogue>) => void;

  openSources: (sourceId?: string) => void;
  closeSources: () => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeBody: "moon",
      mode: "intro",
      selectedSiteId: null,
      hoveredSiteId: null,
      activeStoryTab: "story",
      issPanelOpen: false,

      categoryFilter: "all",
      heroOnly: false,
      siteIndexOpen: false,
      sunLongitude: -48,
      sunLatitude: 1.5,
      heightReady: false,

      loroMood: "waving",
      dialogue: null,

      tourChapterIndex: 0,
      tourBeatIndex: 0,
      tourPaused: false,
      chapterBannerVisible: false,
      isCameraFlying: false,

      sourcesDrawerOpen: false,
      highlightedSourceId: null,
      settings: {
        muted: false,
        voiceEnabled: true,
        captionsEnabled: true,
        reduceMotion: false,
        qualityTier: "auto",
      },

      setActiveBody: (body) =>
        set((s) => {
          if (s.activeBody === body) return s;
          return {
            activeBody: body,
            mode: s.mode === "tour" ? "explore" : s.mode,
            selectedSiteId: null,
            hoveredSiteId: null,
            issPanelOpen: false,
            siteIndexOpen: false,
            categoryFilter: "all",
            heroOnly: false,
            tourChapterIndex: 0,
            tourBeatIndex: 0,
            tourPaused: false,
            chapterBannerVisible: false,
            dialogue: null,
            loroMood: "waving",
            sunLongitude: body === "earth" ? -55 : -48,
            sunLatitude: body === "earth" ? 12 : 1.5,
          };
        }),

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
          categoryFilter: "all",
          heroOnly: false,
          chapterBannerVisible: true,
        }),

      setTourCursor: (tourChapterIndex, tourBeatIndex) =>
        set({ tourChapterIndex, tourBeatIndex }),

      setTourPaused: (tourPaused) => set({ tourPaused }),

      setChapterBannerVisible: (chapterBannerVisible) =>
        set({ chapterBannerVisible }),

      enterExplore: (keepSelection = false) =>
        set((s) => ({
          mode: "explore",
          tourPaused: true,
          loroMood: "narrating",
          dialogue: keepSelection ? s.dialogue : null,
          selectedSiteId: keepSelection ? s.selectedSiteId : null,
          issPanelOpen: keepSelection ? s.issPanelOpen : false,
        })),

      returnToIntro: () =>
        set((s) => ({
          mode: "intro",
          selectedSiteId: null,
          issPanelOpen: false,
          dialogue: null,
          loroMood: "waving",
          tourPaused: false,
          siteIndexOpen: false,
          sunLongitude: s.activeBody === "earth" ? -55 : -48,
          sunLatitude: s.activeBody === "earth" ? 12 : 1.5,
        })),

      selectSite: (siteId, tab) =>
        set((s) => ({
          selectedSiteId: siteId,
          issPanelOpen: siteId !== null ? false : s.issPanelOpen,
          activeStoryTab: tab ?? (siteId !== s.selectedSiteId ? "story" : s.activeStoryTab),
        })),

      setActiveStoryTab: (activeStoryTab) => set({ activeStoryTab }),

      setHoveredSite: (hoveredSiteId) => set({ hoveredSiteId }),

      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

      setHeroOnly: (heroOnly) => set({ heroOnly }),

      setSiteIndexOpen: (siteIndexOpen) => set({ siteIndexOpen }),

      setSunDirection: (sunLongitude, sunLatitude) =>
        set((s) => ({
          sunLongitude,
          sunLatitude: sunLatitude ?? s.sunLatitude,
        })),

      setHeightReady: (heightReady) => set({ heightReady }),

      setCameraFlying: (isCameraFlying) => set({ isCameraFlying }),

      setLoRoMood: (loroMood) => set({ loroMood }),

      setDialogue: (dialogue) => set({ dialogue }),

      patchDialogue: (patch) =>
        set((s) => ({
          dialogue: s.dialogue ? { ...s.dialogue, ...patch } : null,
        })),

      openSources: (sourceId) =>
        set({
          sourcesDrawerOpen: true,
          highlightedSourceId: sourceId ?? null,
        }),

      closeSources: () =>
        set({
          sourcesDrawerOpen: false,
          highlightedSourceId: null,
        }),

      updateSettings: (patch) =>
        set((s) => ({
          settings: { ...s.settings, ...patch },
        })),
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
