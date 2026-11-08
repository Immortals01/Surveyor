import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, LoRoMood, StoryTab } from "@/data/schema";
import type { QualityTier } from "@/lib/quality";

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

export interface UserSettings {
  muted: boolean;
  voiceEnabled: boolean;
  captionsEnabled: boolean;
  reduceMotion: boolean;
  qualityTier: QualityTier | "auto";
}

export interface AppState {
  mode: AppMode;
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  activeStoryTab: StoryTab;

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

function getInitialReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "intro",
      selectedSiteId: null,
      hoveredSiteId: null,
      activeStoryTab: "story",

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
        reduceMotion: getInitialReduceMotion(),
        qualityTier: "auto",
      },

      startTour: (chapterIndex = 0) =>
        set({
          mode: "tour",
          tourChapterIndex: chapterIndex,
          tourBeatIndex: 0,
          tourPaused: false,
          siteIndexOpen: false,
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
        })),

      returnToIntro: () =>
        set({
          mode: "intro",
          selectedSiteId: null,
          dialogue: null,
          loroMood: "waving",
          tourPaused: false,
          siteIndexOpen: false,
          sunLongitude: -48,
          sunLatitude: 1.5,
        }),

      selectSite: (siteId, tab) =>
        set((s) => ({
          selectedSiteId: siteId,
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
      name: "abandoned-not-forgotten-settings-v1",
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
