import { lazy, Suspense, useEffect } from "react";
import {
  BookOpen,
  Globe2,
  ListFilter,
  Minus,
  Moon,
  Orbit,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech, speakLine } from "@/audio/speech";
import { getSitesForBody, SITE_BY_ID } from "@/data";
import type { DialogueLine } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { useTourRunner } from "@/engine/useTourRunner";
import DialogueBox from "@/hud/character/DialogueBox";
import LoRo from "@/hud/character/LoRo";
import IntroScreen from "@/hud/intro/IntroScreen";
import ChapterCard from "@/hud/tour/ChapterCard";
import TourBar from "@/hud/tour/TourBar";
import { normalizeLon } from "@/lib/geo";
import { getLatestIssTelemetry } from "@/lib/issTracker";
import { type CelestialBody, useAppStore } from "@/store/useAppStore";

const SiteDrawer = lazy(() => import("@/hud/story/SiteDrawer"));
const IssDrawer = lazy(() => import("@/hud/earth/IssDrawer"));
const SiteIndex = lazy(() => import("@/hud/explore/SiteIndex"));
const SourcesDrawer = lazy(() => import("@/hud/credits/SourcesDrawer"));

const DEFAULT_MOON_EXPLORE_TIP: DialogueLine = {
  id: "loro-tip-1",
  speaker: "loro",
  mood: "waving",
  text: "Click any glowing marker on the Moon—or open 'Index (29)' above—to swoop down and hear what our left-behind spacecraft remember!",
  sourceIds: ["S-SVS-4720", "S-WAGNER-2017"],
};

const DEFAULT_EARTH_EXPLORE_TIP: DialogueLine = {
  id: "loro-earth-tip-1",
  speaker: "loro",
  mood: "excited",
  text: "Welcome home to Earth! Click any launch complex or Mission Control pin to see how many space missions started there—or click 'ISS LIVE' to track the International Space Station!",
  sourceIds: ["S-BLUE-MARBLE", "S-NASA-KSC", "S-NASA-ISS"],
};

export default function Hud() {
  const { dispatchTour } = useTourRunner();

  const activeBody = useAppStore((s) => s.activeBody);
  const mode = useAppStore((s) => s.mode);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const issPanelOpen = useAppStore((s) => s.issPanelOpen);
  const siteIndexOpen = useAppStore((s) => s.siteIndexOpen);
  const sourcesDrawerOpen = useAppStore((s) => s.sourcesDrawerOpen);
  const muted = useAppStore((s) => s.settings.muted);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const setActiveBody = useAppStore((s) => s.setActiveBody);
  const setIssPanelOpen = useAppStore((s) => s.setIssPanelOpen);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const startTour = useAppStore((s) => s.startTour);
  const returnToIntro = useAppStore((s) => s.returnToIntro);
  const setSiteIndexOpen = useAppStore((s) => s.setSiteIndexOpen);
  const openSources = useAppStore((s) => s.openSources);

  const sites = getSitesForBody(activeBody);

  // Global Escape shortcut for layered drawers, selected sites, and orbit reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur?.();

      const state = useAppStore.getState();
      if (state.sourcesDrawerOpen) {
        state.closeSources();
        return;
      }
      if (state.siteIndexOpen) {
        state.setSiteIndexOpen(false);
        return;
      }
      if (state.issPanelOpen) {
        state.setIssPanelOpen(false);
        void cameraBus.goHome();
        return;
      }
      if (state.selectedSiteId) {
        cancelSpeech();
        state.setDialogue(null);
        if (state.mode === "tour") {
          state.enterExplore(false);
        } else {
          state.selectSite(null);
        }
        void cameraBus.goHome();
        return;
      }
      if (state.mode === "tour") {
        cancelSpeech();
        state.enterExplore(false);
        void cameraBus.goHome();
        return;
      }
      if (state.mode === "explore") {
        cancelSpeech();
        state.setDialogue(null);
        void cameraBus.goHome();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;
    audioEngine.unlock(nextMuted);
    audioEngine.setMuted(nextMuted);
    updateSettings({ muted: nextMuted });
  };

  const handleSwitchBody = (targetBody: CelestialBody) => {
    if (targetBody === activeBody) return;
    audioEngine.unlock(muted);
    audioEngine.playUiTick(840);
    cancelSpeech();
    setActiveBody(targetBody);
    if (targetBody === "earth") {
      // Frame the Americas/Atlantic spaceports with the Moon visible in the upper-right sky
      void cameraBus.flyOverview(20, -38, 3.15);
    } else {
      void cameraBus.flyOverview(6, 0, 3.15);
    }
  };

  const handleTrackIss = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick(920);
    cancelSpeech();
    const state = useAppStore.getState();
    if (state.mode !== "explore") {
      state.enterExplore(true);
    }
    const live = getLatestIssTelemetry();
    state.setSunDirection(normalizeLon(live.lon - 15), 12);
    setIssPanelOpen(true);
    void cameraBus.flyToLatLon(live.lat, live.lon, { altitude: 0.44 });
  };

  const handleLoRoClick = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    const state = useAppStore.getState();
    const selected = state.selectedSiteId
      ? SITE_BY_ID.get(state.selectedSiteId)
      : undefined;

    const defaultTip =
      state.activeBody === "earth"
        ? DEFAULT_EARTH_EXPLORE_TIP
        : DEFAULT_MOON_EXPLORE_TIP;

    const line =
      selected && selected.tier === "hero" ? selected.loroIntro : defaultTip;

    state.setLoRoMood(line.mood);
    state.setDialogue({
      lineId: line.id,
      speaker: "loro",
      speakerLabel: "SURVEYOR 3 (1967)",
      text: line.text,
      sourceIds: line.sourceIds,
      isRevealing: !reduceMotion,
      isSpeaking: true,
    });
    void speakLine(line).finally(() => {
      useAppStore
        .getState()
        .patchDialogue({ isSpeaking: false, isRevealing: false });
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Navigation & Telemetry Bar */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-2">
        {/* Left Brand / Globe Switcher / Mode Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {mode === "intro" ? (
            <div className="flex items-center gap-2.5 border border-white/15 bg-space-950/85 px-3.5 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-sunlit" />
              <span className="font-display text-sm font-bold tracking-wider text-regolith-bright uppercase">
                Surveyor
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                returnToIntro();
                void cameraBus.goHome();
              }}
              className="group flex cursor-pointer items-center gap-3 border border-white/15 bg-space-950/85 px-3.5 py-2 text-left backdrop-blur-md transition hover:border-regolith-bright focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              title="Return to Mission Briefing"
            >
              <span className="h-2 w-2 rounded-full bg-sunlit" />
              <div>
                <p className="font-mono text-[9.5px] tracking-[0.16em] text-regolith/65 uppercase">
                  {activeBody === "earth" ? "EARTH ARCHIVE" : "LRO ARCHIVE"}
                </p>
                <p className="font-display text-xs font-bold tracking-tight text-regolith-bright">
                  Surveyor
                </p>
              </div>
            </button>
          )}

          {/* Celestial Body Switcher: Moon <-> Earth */}
          <div
            className="inline-flex items-center border border-white/15 bg-space-950/85 p-0.5 backdrop-blur-md"
            role="group"
            aria-label="Switch celestial body between Moon and Earth"
          >
            <button
              type="button"
              onClick={() => handleSwitchBody("moon")}
              aria-pressed={activeBody === "moon"}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                activeBody === "moon"
                  ? "bg-regolith-bright text-space-950 shadow-sm"
                  : "text-regolith/75 hover:bg-white/10 hover:text-white"
              }`}
              title="Explore 29 Lunar Hardware Sites on the Moon"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Moon</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBody("earth")}
              aria-pressed={activeBody === "earth"}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                activeBody === "earth"
                  ? "bg-loro text-space-950 shadow-sm"
                  : "text-regolith/75 hover:bg-white/10 hover:text-white"
              }`}
              title="Explore 24 Historic Space Launch Sites & Live ISS on Earth"
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Earth</span>
            </button>
          </div>

          {mode === "explore" && (
            <>
              <button
                type="button"
                onClick={() => {
                  audioEngine.unlock(muted);
                  audioEngine.playUiTick();
                  startTour(0);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-regolith-bright bg-regolith-bright px-3.5 py-2 font-mono text-[11px] font-bold tracking-wider text-space-950 uppercase transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Guided Tour</span>
              </button>

              {activeBody === "earth" && (
                <button
                  type="button"
                  onClick={handleTrackIss}
                  className={`inline-flex cursor-pointer items-center gap-1.5 border px-3 py-2 font-mono text-[11px] font-bold tracking-wider uppercase backdrop-blur-md transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                    issPanelOpen
                      ? "border-sunlit bg-sunlit/20 text-sunlit"
                      : "border-loro/50 bg-space-950/85 text-loro hover:border-loro hover:bg-loro/15"
                  }`}
                  title="Fly to the real-time location of the International Space Station"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <Orbit className="h-3.5 w-3.5" />
                  <span>ISS Live</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiTick();
                  useAppStore.getState().selectSite(null);
                  useAppStore.getState().setIssPanelOpen(false);
                  void cameraBus.goHome();
                }}
                className="hidden cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] text-regolith uppercase backdrop-blur-md hover:border-white/40 hover:text-white sm:inline-flex"
                title={`Reset camera to full ${activeBody === "earth" ? "Earth" : "lunar"} globe (Esc)`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Orbit</span>
              </button>

              <div className="hidden items-center border border-white/15 bg-space-950/85 backdrop-blur-md sm:inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiTick(920);
                    cameraBus.zoomIn();
                  }}
                  className="cursor-pointer p-2 text-regolith transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                  aria-label="Zoom in"
                  title="Zoom in (+)"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="h-4 w-px bg-white/15" />
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playUiTick(720);
                    cameraBus.zoomOut();
                  }}
                  className="cursor-pointer p-2 text-regolith transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                  aria-label="Zoom out"
                  title="Zoom out (-)"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Center Mode Controls (Tour Bar) */}
        {mode === "tour" && <TourBar dispatchTour={dispatchTour} />}

        {/* Right Utility Controls */}
        <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
          {mode !== "intro" && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                setSiteIndexOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] tracking-wider text-regolith-bright uppercase backdrop-blur-md transition hover:border-loro hover:text-loro focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              title={`Browse and search all ${sites.length} ${activeBody === "earth" ? "Earth space sites" : "lunar artifacts"}`}
            >
              <ListFilter className="h-3.5 w-3.5 text-loro" />
              <span>Index ({sites.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiTick();
              openSources();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] tracking-wider text-regolith uppercase backdrop-blur-md transition hover:border-sunlit hover:text-sunlit focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            title="View verified NASA open datasets and citations"
          >
            <BookOpen className="h-3.5 w-3.5 text-sunlit" />
            <span className="hidden sm:inline">NASA Data</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="cursor-pointer border border-white/15 bg-space-950/85 p-2 text-regolith backdrop-blur-md transition hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label={muted ? "Unmute audio" : "Mute audio"}
            title={muted ? "Unmute audio" : "Mute audio"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-alert" />
            ) : (
              <Volume2 className="h-4 w-4 text-loro" />
            )}
          </button>
        </div>
      </header>

      {/* Tour Chapter Title Banner */}
      <ChapterCard />

      {/* Intro Welcome Screen */}
      {mode === "intro" && <IntroScreen />}

      {/* Surveyor 3 Hero Storyteller Stage & Callout Arrow */}
      {mode !== "intro" && (
        <div
          className={`mt-auto flex flex-col items-start gap-0 transition-all ${
            selectedSiteId || issPanelOpen
              ? "hidden lg:flex lg:max-w-[calc(100vw-470px)]"
              : "max-w-xl"
          }`}
        >
          <DialogueBox
            onAdvanceTour={() => dispatchTour({ type: "NEXT_BEAT" })}
          />

          <button
            type="button"
            onClick={handleLoRoClick}
            className="pointer-events-auto group relative shrink-0 cursor-pointer border border-loro/40 bg-space-950/90 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition hover:border-loro hover:bg-space-900/90 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            title="Click Surveyor 3 for voice commentary"
          >
            {/* Corner telemetry brackets */}
            <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-loro" />
            <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-loro" />
            <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-loro" />
            <span className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-loro" />

            <LoRo size="lg" />

            <div className="mt-1.5 flex items-center justify-center border-t border-white/15 pt-1.5 px-1 font-mono text-[9.5px] tracking-[0.14em] uppercase">
              <span className="text-regolith-bright font-semibold">
                SURVEYOR 3 - HOST
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Selected Site Exhibit Drawer */}
      {selectedSiteId && (
        <Suspense fallback={null}>
          <SiteDrawer />
        </Suspense>
      )}

      {/* Live International Space Station Telemetry Drawer */}
      {issPanelOpen && activeBody === "earth" && (
        <Suspense fallback={null}>
          <IssDrawer />
        </Suspense>
      )}

      {/* Accessible All-Sites Directory Modal */}
      {siteIndexOpen && (
        <Suspense fallback={null}>
          <SiteIndex />
        </Suspense>
      )}

      {/* NASA Open Data Bibliography Modal */}
      {sourcesDrawerOpen && (
        <Suspense fallback={null}>
          <SourcesDrawer />
        </Suspense>
      )}
    </div>
  );
}
