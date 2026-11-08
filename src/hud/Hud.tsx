import { lazy, Suspense, useEffect } from "react";
import {
  BookOpen,
  ListFilter,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { speakLine } from "@/audio/speech";
import { SITE_BY_ID } from "@/data";
import type { DialogueLine } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { useTourRunner } from "@/engine/useTourRunner";
import DialogueBox from "@/hud/character/DialogueBox";
import LoRo from "@/hud/character/LoRo";
import FilterBar from "@/hud/explore/FilterBar";
import SiteIndex from "@/hud/explore/SiteIndex";
import SunControl from "@/hud/explore/SunControl";
import IntroScreen from "@/hud/intro/IntroScreen";
import SiteDrawer from "@/hud/story/SiteDrawer";
import ChapterCard from "@/hud/tour/ChapterCard";
import TourBar from "@/hud/tour/TourBar";
import { useAppStore } from "@/store/useAppStore";

const SourcesDrawer = lazy(() => import("@/hud/credits/SourcesDrawer"));

const EXPLORE_TIPS: DialogueLine[] = [
  {
    id: "loro-tip-1",
    speaker: "loro",
    mood: "waving",
    text: "Click any glowing marker on the Moon—or open 'All 29 Sites' above—to swoop down and hear what our left-behind spacecraft remember!",
    sourceIds: ["S-SVS-4720", "S-WAGNER-2017"],
  },
  {
    id: "loro-tip-2",
    speaker: "loro",
    mood: "scanning",
    text: "Try dragging the 'Lunar Day' sun slider at the top! Watching long sunset shadows stretch across Oceanus Procellarum is how my LROC camera spots tiny landers.",
    sourceIds: ["S-LROC-FEATURED"],
  },
  {
    id: "loro-tip-3",
    speaker: "loro",
    mood: "excited",
    text: "Spin around to the lunar farside or South Pole! Ranger 8's twin cousins, Lunar Orbiter crash sites, and the future Artemis III zone are waiting.",
    sourceIds: ["S-ARTEMIS-III", "S-WAGNER-2017"],
  },
];

export default function Hud() {
  const { dispatchTour } = useTourRunner();

  const mode = useAppStore((s) => s.mode);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const dialogue = useAppStore((s) => s.dialogue);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const startTour = useAppStore((s) => s.startTour);
  const returnToIntro = useAppStore((s) => s.returnToIntro);
  const setSiteIndexOpen = useAppStore((s) => s.setSiteIndexOpen);
  const openSources = useAppStore((s) => s.openSources);

  // Global Escape shortcut for layered drawers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const state = useAppStore.getState();
      if (state.sourcesDrawerOpen) {
        state.closeSources();
      } else if (state.siteIndexOpen) {
        state.setSiteIndexOpen(false);
      } else if (state.selectedSiteId && state.mode === "explore") {
        state.selectSite(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleMute = () => {
    const nextMuted = !settings.muted;
    audioEngine.unlock(nextMuted);
    audioEngine.setMuted(nextMuted);
    updateSettings({ muted: nextMuted });
  };

  const handleLoRoClick = () => {
    audioEngine.unlock(settings.muted);
    audioEngine.playUiTick();
    const state = useAppStore.getState();
    const selected = state.selectedSiteId
      ? SITE_BY_ID.get(state.selectedSiteId)
      : undefined;

    const line =
      selected && selected.tier === "hero"
        ? selected.loroIntro
        : EXPLORE_TIPS[Math.floor(Math.random() * EXPLORE_TIPS.length)]!;

    state.setLoRoMood(line.mood);
    state.setDialogue({
      lineId: line.id,
      speaker: "loro",
      speakerLabel: "LO-RO // ORBITAL GUIDE",
      text: line.text,
      sourceIds: line.sourceIds,
      isRevealing: !settings.reduceMotion,
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
        {/* Left Brand / Mode Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {mode === "intro" ? (
            <div className="font-mono text-[11px] tracking-[0.2em] text-regolith/60 uppercase">
              2026 NASA SPACE APPS // LUNAR ARTIFACT ARCHIVE
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
                  LRO // ARCHIVE
                </p>
                <p className="font-display text-xs font-bold tracking-tight text-regolith-bright">
                  Abandoned, Not Forgotten
                </p>
              </div>
            </button>
          )}

          {mode === "explore" && (
            <>
              <button
                type="button"
                onClick={() => {
                  audioEngine.unlock(settings.muted);
                  audioEngine.playUiTick();
                  startTour(0);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-regolith-bright bg-regolith-bright px-3.5 py-2 font-mono text-[11px] font-bold tracking-wider text-space-950 uppercase transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Guided Tour</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiTick();
                  useAppStore.getState().selectSite(null);
                  void cameraBus.goHome();
                }}
                className="hidden cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] text-regolith uppercase backdrop-blur-md hover:border-white/40 hover:text-white sm:inline-flex"
                title="Reset camera to full lunar globe"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Orbit</span>
              </button>
            </>
          )}
        </div>

        {/* Center Mode Controls (Tour Bar or Category Filter Bar) */}
        {mode === "tour" && <TourBar dispatchTour={dispatchTour} />}
        {mode === "explore" && <FilterBar />}

        {/* Right Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {mode === "explore" && <SunControl />}

          {mode !== "intro" && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                setSiteIndexOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/85 px-3 py-2 font-mono text-[11px] tracking-wider text-regolith-bright uppercase backdrop-blur-md transition hover:border-loro hover:text-loro focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              title="Browse and search all 29 lunar artifacts"
            >
              <ListFilter className="h-3.5 w-3.5 text-loro" />
              <span>Index (29)</span>
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
            aria-label={settings.muted ? "Unmute audio" : "Mute audio"}
            title={settings.muted ? "Unmute audio" : "Mute audio"}
          >
            {settings.muted ? (
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

      {/* Bottom-Left Lo-Ro Orbital Storyteller Dock */}
      {mode !== "intro" && (
        <div
          className={`flex items-end gap-3 transition-all ${
            selectedSiteId ? "hidden lg:flex lg:max-w-[calc(100vw-490px)]" : "max-w-2xl"
          }`}
        >
          <button
            type="button"
            onClick={handleLoRoClick}
            className="pointer-events-auto group relative cursor-pointer border border-white/15 bg-space-950/85 p-1.5 backdrop-blur-md transition hover:border-loro focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            title="Click Lo-Ro for orbital commentary"
          >
            <LoRo size="sm" />
            {!dialogue && (
              <span className="mt-1 block border-t border-white/10 pt-1 text-center font-mono text-[9px] tracking-wider text-loro uppercase">
                COMMS
              </span>
            )}
          </button>

          <DialogueBox
            onAdvanceTour={() => dispatchTour({ type: "NEXT_BEAT" })}
          />
        </div>
      )}

      {/* Selected Site Exhibit Drawer */}
      <SiteDrawer />

      {/* Accessible All-Sites Directory Modal */}
      <SiteIndex />

      {/* NASA Open Data Bibliography Modal */}
      <Suspense fallback={null}>
        <SourcesDrawer />
      </Suspense>
    </div>
  );
}
