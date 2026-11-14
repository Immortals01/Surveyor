import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MachineTab } from "@/data/machines";
import type { Category, CelestialBody, LoRoMood } from "@/data/schema";
import { DEFAULT_HOST, resolveHostForSite, type HostId } from "@/data/hosts";
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
}

export interface PersistedSettings {
  muted: boolean;
  voiceEnabled: boolean;
  captionsEnabled: boolean;
  reduceMotion: boolean;
  qualityTier: QualityTier | "auto";
}

export interface AppState {
  // Celestial body ("moon" | "mars")
  celestialBody: CelestialBody;
  activeBody: CelestialBody;
  setCelestialBody: (body: CelestialBody) => void;
  setActiveBody: (body: CelestialBody) => void;

  // Primary experience state
  mode: AppMode;
  selectedSiteId: string | null;
  selectedMachineId: string | null;
  machineTab: MachineTab;
  hoveredSiteId: string | null;

  // Guided Tour cursor
  tourChapterIndex: number;
  tourBeatIndex: number;
  tourPaused: boolean;
  chapterBannerVisible: boolean;
  tourComplete: boolean;

  // Explore filter state
  categoryFilter: Category | "all";
  heroOnly: boolean;
  siteIndexOpen: boolean;

  // Sources & credits modal
  sourcesDrawerOpen: boolean;
  highlightedSourceId: string | null;

  // Lo-Ro character & speech bubble
  loroMood: LoRoMood;
  /** Cartoon host currently on stage (Surveyor 3, Surveyor 1/7, Eagle, Intrepid, Antares). */
  activeHostId: HostId;
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
  startTour: (chapterIndex?: number) => void;
  enterExplore: (keepSelection?: boolean) => void;
  returnToIntro: () => void;
  setTourCursor: (chapterIndex: number, beatIndex: number) => void;
  setTourPaused: (paused: boolean) => void;
  setChapterBannerVisible: (visible: boolean) => void;
  setTourComplete: (complete: boolean) => void;
  selectSite: (siteId: string | null) => void;
  openMachine: (machineId: string) => void;
  closeMachine: () => void;
  setMachineTab: (tab: MachineTab) => void;
  setHoveredSite: (siteId: string | null) => void;
  setCategoryFilter: (cat: Category | "all") => void;
  setHeroOnly: (heroOnly: boolean) => void;
  setSiteIndexOpen: (open: boolean) => void;
  machineAutoplay: boolean;
  setMachineAutoplay: (autoplay: boolean) => void;
  openSources: (sourceId?: string) => void;
  closeSources: () => void;
  setLoRoMood: (mood: LoRoMood) => void;
  setActiveHost: (hostId: HostId) => void;
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
  // Each body has its own chapter list, so a tour cursor cannot be carried across
  // bodies. Switching body mid-tour restarts that body's tour at Chapter 1 instead
  // of dropping the visitor into Free Explore; the chapter banner explains the move.
  const stayingInTour = s.mode === "tour";
  return {
    celestialBody: body,
    activeBody: body,
    heightReady: isHeightLoaded(body),
    mode: s.mode,
    selectedSiteId: null,
    selectedMachineId: null,
    hoveredSiteId: null,
    siteIndexOpen: false,
    categoryFilter: "all",
    heroOnly: false,
    tourChapterIndex: 0,
    tourBeatIndex: 0,
    tourPaused: false,
    chapterBannerVisible: stayingInTour,
    tourComplete: false,
    sunLongitude: body === "mars" ? 18 : -48,
    sunLatitude: body === "mars" ? 8 : 1.5,
    loroMood: "waving",
    activeHostId: DEFAULT_HOST,
    dialogue:
      s.mode === "intro"
        ? null
        : {
            lineId: `switch-body-${body}`,
            speaker: "loro",
            speakerLabel:
              body === "mars"
                ? "SURVEYOR 3 · DEEP-SPACE MARS RELAY"
                : "SURVEYOR 3",
            text:
              body === "mars"
                ? "Deep-Space Network relay locked onto Mars! From Viking 1 and the marathon rover Opportunity to InSight's marsquake ears and Ingenuity's 72 flights—click any marker to explore 11 Red Planet pioneers!"
                : "Back in lunar orbit above my home crater! Click any glowing beacon on the Moon to visit 20 Apollo, ALSEP, LRV, and Surveyor hardware sites.",
            sourceIds:
              body === "mars"
                ? ["S-MOLA-MEGDR", "S-HIRISE-HARDWARE"]
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
      selectedMachineId: null,
      machineTab: "story",
      machineAutoplay: false,
      hoveredSiteId: null,

      tourChapterIndex: 0,
      tourBeatIndex: 0,
      tourPaused: false,
      chapterBannerVisible: false,
      tourComplete: false,

      categoryFilter: "all",
      heroOnly: false,
      siteIndexOpen: false,

      sourcesDrawerOpen: false,
      highlightedSourceId: null,

      loroMood: "waving",
      activeHostId: DEFAULT_HOST,
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

      startTour: (chapterIndex = 0) =>
        set({
          mode: "tour",
          tourChapterIndex: chapterIndex,
          tourBeatIndex: 0,
          tourPaused: false,
          siteIndexOpen: false,
          chapterBannerVisible: true,
          tourComplete: false,
          dialogue: null,
          categoryFilter: "all",
          heroOnly: false,
        }),

      enterExplore: (keepSelection = true) =>
        set((s) => ({
          mode: "explore",
          tourPaused: true,
          chapterBannerVisible: false,
          selectedSiteId: keepSelection ? s.selectedSiteId : null,
          selectedMachineId: null,
          loroMood: "waving",
        })),

      returnToIntro: () =>
        set((s) => ({
          mode: "intro",
          tourPaused: true,
          chapterBannerVisible: false,
          tourComplete: false,
          selectedSiteId: null,
          selectedMachineId: null,
          hoveredSiteId: null,
          dialogue: null,
          loroMood: "waving",
          activeHostId: DEFAULT_HOST,
          siteIndexOpen: false,
          sunLongitude: s.celestialBody === "mars" ? 18 : -48,
          sunLatitude: s.celestialBody === "mars" ? 8 : 1.5,
        })),

      setTourCursor: (chapterIndex, beatIndex) =>
        set({ tourChapterIndex: chapterIndex, tourBeatIndex: beatIndex }),

      setTourPaused: (tourPaused) => set({ tourPaused }),

      setChapterBannerVisible: (chapterBannerVisible) =>
        set({ chapterBannerVisible }),

      setTourComplete: (tourComplete) => set({ tourComplete }),

      selectSite: (siteId) =>
        set({
          selectedSiteId: siteId,
          selectedMachineId: null,
          machineAutoplay: false,
          activeHostId: resolveHostForSite(siteId),
          dialogue: null,
        }),

      openMachine: (machineId) =>
        set((s) => ({
          mode: s.mode === "intro" ? "explore" : s.mode,
          selectedMachineId: machineId,
          machineTab: "story",
          selectedSiteId: null,
          hoveredSiteId: null,
          siteIndexOpen: false,
          chapterBannerVisible: false,
          dialogue: null,
          loroMood: "waving",
          activeHostId: DEFAULT_HOST,
        })),

      closeMachine: () => set({ selectedMachineId: null, machineTab: "story" }),

      setMachineTab: (machineTab) => set({ machineTab }),

      setHoveredSite: (hoveredSiteId) => set({ hoveredSiteId }),

      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

      setHeroOnly: (heroOnly) => set({ heroOnly }),

      setSiteIndexOpen: (siteIndexOpen) => set({ siteIndexOpen }),
      setMachineAutoplay: (machineAutoplay) => set({ machineAutoplay }),

      openSources: (sourceId) =>
        set({
          sourcesDrawerOpen: true,
          highlightedSourceId: sourceId ?? null,
        }),

      closeSources: () =>
        set({ sourcesDrawerOpen: false, highlightedSourceId: null }),

      setLoRoMood: (loroMood) => set({ loroMood }),

      setActiveHost: (activeHostId) => set({ activeHostId }),

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
