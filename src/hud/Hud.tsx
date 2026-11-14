import { lazy, Suspense, useEffect, useState } from "react";
import {
  BookOpen,
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
import { stopMachineNarration } from "@/audio/machineNarration";
import { cancelSpeech, speakLine } from "@/audio/speech";
import { getSitesForBody, SITE_BY_ID } from "@/data";
import { getHost } from "@/data/hosts";
import type { DialogueLine } from "@/data/schema";
import { resolveHostLine } from "./character/hostLine";
import { cameraBus } from "@/engine/camera";
import { useTourRunner } from "@/engine/useTourRunner";
import DialogueBox from "@/hud/character/DialogueBox";
import LoRo from "@/hud/character/LoRo";
import IntroScreen from "@/hud/intro/IntroScreen";
import ChapterCard from "@/hud/tour/ChapterCard";
import TourBar from "@/hud/tour/TourBar";
import TourCompleteCard from "@/hud/tour/TourCompleteCard";
import { type CelestialBody, useAppStore } from "@/store/useAppStore";

const SiteDrawer = lazy(() => import("@/hud/story/SiteDrawer"));
const SiteIndex = lazy(() => import("@/hud/explore/SiteIndex"));
const DeepSpaceShelf = lazy(() => import("@/hud/explore/DeepSpaceShelf"));
const SourcesDrawer = lazy(() => import("@/hud/credits/SourcesDrawer"));
const MachineDossier = lazy(() => import("@/hud/machines/MachineDossier"));

export default function Hud() {
  const { dispatchTour } = useTourRunner();

  const mode = useAppStore((s) => s.mode);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const setCelestialBody = useAppStore((s) => s.setCelestialBody);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectedMachineId = useAppStore((s) => s.selectedMachineId);
  const siteIndexOpen = useAppStore((s) => s.siteIndexOpen);
  const sourcesDrawerOpen = useAppStore((s) => s.sourcesDrawerOpen);
  const muted = useAppStore((s) => s.settings.muted);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const activeHost = getHost(useAppStore((s) => s.activeHostId));
  const updateSettings = useAppStore((s) => s.updateSettings);
  const startTour = useAppStore((s) => s.startTour);
  const returnToIntro = useAppStore((s) => s.returnToIntro);
  const setSiteIndexOpen = useAppStore((s) => s.setSiteIndexOpen);
  const setDeepSpaceOpen = useAppStore((s) => s.setDeepSpaceOpen);
  const deepSpaceOpen = useAppStore((s) => s.deepSpaceOpen);
  const openSources = useAppStore((s) => s.openSources);
  const [tourScopeHovered, setTourScopeHovered] = useState(false);

  const isMars = celestialBody === "mars";
  const sites = getSitesForBody(celestialBody);
  const siteCount = sites.length;

  // Mount the Surveyor 3 stage (hidden + paused) partway through the intro so its
  // WebGL context, mascot shaders, and lazy chunk are warm before the visitor
  // clicks "Start Moon Tour" — otherwise that work lands on the first camera flight.
  const [stageWarmed, setStageWarmed] = useState(false);
  useEffect(() => {
    if (mode !== "intro") return;
    const timer = window.setTimeout(() => setStageWarmed(true), 1500);
    return () => window.clearTimeout(timer);
  }, [mode]);
  const stageMounted = mode === "tour" || (mode === "intro" && stageWarmed);

  // Global Escape shortcut for layered drawers, selected planetary sites, and orbit reset
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
      if (state.deepSpaceStoryId) {
        state.setDeepSpaceStoryId(null);
        return;
      }
      if (state.deepSpaceOpen) {
        state.setDeepSpaceOpen(false);
        return;
      }
      if (state.selectedMachineId) {
        stopMachineNarration();
        state.setDialogue(null);
        state.closeMachine();
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
    // While the Deep Space shelf is open the active body is still the last real
    // globe, so an early return here would swallow the click that should bring
    // the Moon (or Mars) back into view.
    if (celestialBody === targetBody && !deepSpaceOpen) return;
    audioEngine.unlock(muted);
    audioEngine.playUiTick(840);
    cancelSpeech();
    stopMachineNarration();
    useAppStore.getState().closeMachine();
    setDeepSpaceOpen(false);
    setCelestialBody(targetBody);
    void cameraBus.goHome();
  };

  const handleOpenDeepSpace = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick(900);
    cancelSpeech();
    stopMachineNarration();
    const state = useAppStore.getState();
    state.closeMachine();
    state.selectSite(null);
    state.enterExplore(false);
    state.setDeepSpaceOpen(true);
  };

  const handleLoRoClick = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    const state = useAppStore.getState();
    const host = getHost(state.activeHostId);
    const selected = state.selectedSiteId
      ? SITE_BY_ID.get(state.selectedSiteId)
      : undefined;

    // If a line is already on screen, replay exactly that line. Otherwise use
    // the same resolver as the callout box so text and audio stay identical.
    const shown = state.dialogue;
    const line: DialogueLine = shown
      ? {
          id: shown.lineId,
          speaker: shown.speaker,
          speakerLabel: shown.speakerLabel,
          mood: state.loroMood,
          text: shown.text,
          sourceIds: shown.sourceIds,
        }
      : resolveHostLine(
          selected,
          host,
          state.celestialBody === "mars",
        );

    state.setLoRoMood(line.mood);
    state.setDialogue({
      lineId: line.id,
      speaker: line.speaker,
      speakerLabel:
        line.speakerLabel ??
        (state.celestialBody === "mars"
          ? "SURVEYOR 3 · DEEP-SPACE MARS RELAY"
          : "SURVEYOR 3"),
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

  const bodyLabel = isMars ? "Martian" : "lunar";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Navigation & Telemetry Bar */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-2">
        {/* Left Brand / World Selector / Mode Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {mode === "intro" ? (
            <div className="flex items-center gap-2.5 border border-white/15 bg-space-950/85 px-3.5 py-2 backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  isMars ? "bg-orange-400" : "bg-sunlit"
                }`}
              />
              <span className="font-display text-sm font-bold tracking-wider text-regolith-bright uppercase">
                Surveyor
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                stopMachineNarration();
                useAppStore.getState().closeMachine();
                returnToIntro();
                void cameraBus.goHome();
              }}
              className="group flex cursor-pointer items-center gap-3 border border-white/15 bg-space-950/85 px-3.5 py-2 text-left backdrop-blur-md transition hover:border-regolith-bright focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              title="Return to Mission Briefing"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isMars ? "bg-orange-400" : "bg-sunlit"
                }`}
              />
              <div>
                {isMars && (
                  <p className="font-mono text-[9.5px] tracking-[0.16em] text-regolith/65 uppercase">
                    MRO / MOLA ARCHIVE
                  </p>
                )}
                <p className="font-display text-xs font-bold tracking-tight text-regolith-bright">
                  Surveyor
                </p>
              </div>
            </button>
          )}

          {/* Celestial Body Switcher: Moon <-> Mars */}
          <div
            role="group"
            aria-label="Select destination"
            className="inline-flex items-center border border-white/15 bg-space-950/85 p-0.5 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => handleSwitchBody("moon")}
              aria-pressed={!deepSpaceOpen && celestialBody === "moon"}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                celestialBody === "moon"
                  ? "bg-sunlit text-space-950 shadow-sm"
                  : "text-regolith/75 hover:bg-white/10 hover:text-white"
              }`}
              title="Switch to the Moon (20 NASA Hardware Sites)"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Moon</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBody("mars")}
              aria-pressed={!deepSpaceOpen && celestialBody === "mars"}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                celestialBody === "mars"
                  ? "bg-orange-400 text-space-950 shadow-sm"
                  : "text-regolith/75 hover:bg-white/10 hover:text-white"
              }`}
              title="Switch to Mars (11 Robotic Hardware Sites)"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span>Mars</span>
            </button>
            <span className="h-4 w-px bg-white/15" />
            <button
              type="button"
              onClick={handleOpenDeepSpace}
              aria-pressed={deepSpaceOpen}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                deepSpaceOpen
                  ? "bg-loro text-space-950 shadow-sm"
                  : "text-regolith/75 hover:bg-white/10 hover:text-white"
              }`}
              title="Explore hardware beyond the Moon and Mars"
            >
              <Orbit className="h-3.5 w-3.5" />
              <span>Deep Space</span>
            </button>
          </div>

          {mode === "explore" && (
            <>
              <span
                className={`relative inline-flex ${
                  deepSpaceOpen ? "cursor-not-allowed" : ""
                }`}
                onMouseEnter={() => setTourScopeHovered(true)}
                onMouseLeave={() => setTourScopeHovered(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (deepSpaceOpen) return;
                    audioEngine.unlock(muted);
                    audioEngine.playUiTick();
                    startTour(0);
                  }}
                  disabled={deepSpaceOpen}
                  aria-disabled={deepSpaceOpen}
                  aria-describedby={
                    deepSpaceOpen ? "guided-tour-scope" : undefined
                  }
                  className={`inline-flex items-center gap-1.5 border px-3.5 py-2 font-mono text-[11px] font-bold tracking-wider uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                    deepSpaceOpen
                      ? "pointer-events-none border-white/10 bg-white/[0.04] text-regolith/40"
                      : "cursor-pointer border-regolith-bright bg-regolith-bright text-space-950 hover:bg-white"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Guided Tour</span>
                </button>
                {deepSpaceOpen && (
                  <span
                    id="guided-tour-scope"
                    role="tooltip"
                    className={`pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 border border-loro/40 bg-space-950/97 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] whitespace-nowrap text-regolith-bright uppercase shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-opacity duration-150 ${
                      tourScopeHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    Moon &amp; Mars only
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiTick();
                  useAppStore.getState().selectSite(null);
                  void cameraBus.goHome();
                }}
                className="hidden cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] text-regolith uppercase backdrop-blur-md hover:border-white/40 hover:text-white sm:inline-flex"
                title={`Reset camera to full ${bodyLabel} globe (Esc)`}
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
              title={`Browse and search all ${siteCount} ${bodyLabel} artifacts`}
            >
              <ListFilter className="h-3.5 w-3.5 text-loro" />
              <span>Index ({siteCount})</span>
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

      {/* Cross-body hand-off when the Moon or Mars guide ends */}
      <TourCompleteCard />

      {/* Intro Welcome Screen */}
      {mode === "intro" && <IntroScreen />}

      {/* Surveyor 3 Hero Storyteller Stage & Callout Arrow (hidden in Free Orbit sandbox).
          Pre-mounted beneath the intro overlay so the click only flips visibility. */}
      {stageMounted && (
        <div
          aria-hidden={mode !== "tour"}
          className={`mt-auto flex flex-col items-start gap-0 transition-all ${
            mode !== "tour"
              ? "pointer-events-none invisible opacity-0"
              : selectedSiteId
                ? "hidden lg:flex lg:w-[300px]"
                : "w-[272px] sm:w-[300px]"
          }`}
        >
          {mode === "tour" && (
            <DialogueBox
              onAdvanceTour={() => dispatchTour({ type: "NEXT_BEAT" })}
            />
          )}

          <button
            type="button"
            onClick={handleLoRoClick}
            className="pointer-events-auto group relative shrink-0 cursor-pointer border border-loro/40 bg-space-950/90 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition hover:border-loro hover:bg-space-900/90 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            title={`Click ${activeHost.name} for voice commentary`}
          >
            {/* Corner telemetry brackets */}
            <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-loro" />
            <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-loro" />
            <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-loro" />
            <span className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-loro" />

            <LoRo size="lg" active={mode === "tour"} />

            <div className="mt-1.5 flex items-center justify-center border-t border-white/15 pt-1.5 px-1 font-mono text-[9.5px] tracking-[0.14em] uppercase">
              <span className="text-regolith-bright font-semibold">
                {activeHost.name.toUpperCase()}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Machine story dossier */}
      {selectedMachineId && (
        <Suspense fallback={null}>
          <MachineDossier />
        </Suspense>
      )}

      {/* Selected Site Exhibit Drawer */}
      {selectedSiteId && (
        <Suspense fallback={null}>
          <SiteDrawer />
        </Suspense>
      )}

      {/* Accessible All-Sites Directory Modal */}
      {siteIndexOpen && (
        <Suspense fallback={null}>
          <SiteIndex />
        </Suspense>
      )}

      {/* Deep Space / Elsewhere Shelf */}
      {deepSpaceOpen && (
        <Suspense fallback={null}>
          <DeepSpaceShelf />
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
