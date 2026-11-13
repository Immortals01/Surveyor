import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Compass, Volume2, VolumeX } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech, speakLine } from "@/audio/speech";
import { HOST_INTRO_MARS, HOST_INTRO_MOON } from "@/data";
import { cameraBus } from "@/engine/camera";
import LoRo from "@/hud/character/LoRo";
import { useAppStore } from "@/store/useAppStore";

/** The welcome greeting plays once per page load, so returning to Home skips straight to the menu. */
let hasIntroduced = false;

export default function IntroScreen() {
  const muted = useAppStore((s) => s.settings.muted);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const startTour = useAppStore((s) => s.startTour);
  const enterExplore = useAppStore((s) => s.enterExplore);

  const [started, setStarted] = useState(hasIntroduced);

  // Fetch the SiteDrawer bundle while the visitor reads the intro so the first
  // tour beat's selectSite() does not pay for the chunk mid camera-flight.
  useEffect(() => {
    let cancelled = false;
    const preload = () => {
      if (!cancelled) void import("@/hud/story/SiteDrawer");
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(preload, { timeout: 2000 });
      return () => {
        cancelled = true;
      };
    }
    const timer = window.setTimeout(preload, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const isMars = celestialBody === "mars";
  const introLine = isMars ? HOST_INTRO_MARS : HOST_INTRO_MOON;

  /** Plays Surveyor 3's self-introduction; clicking the host portrait replays it. */
  const playIntro = useCallback(() => {
    const state = useAppStore.getState();
    const settings = state.settings;
    if (settings.muted) return;

    audioEngine.unlock(false);
    state.setLoRoMood(introLine.mood);
    state.setDialogue({
      lineId: introLine.id,
      speaker: "loro",
      speakerLabel: isMars ? "SURVEYOR 3 · MARS RELAY" : "SURVEYOR 3 (1967)",
      text: introLine.text,
      sourceIds: introLine.sourceIds,
      isRevealing: !settings.reduceMotion,
      isSpeaking: true,
    });

    void speakLine(introLine).finally(() => {
      useAppStore
        .getState()
        .patchDialogue({ isSpeaking: false, isRevealing: false });
    });
  }, [introLine, isMars]);

  const stopIntro = () => {
    cancelSpeech();
    useAppStore.getState().setDialogue(null);
  };

  /**
   * Sound consent. Browsers only permit audio after a real gesture, so these two
   * buttons are the permission prompt: one starts the greeting, the other keeps
   * the museum quiet and simply reveals the menu.
   */
  const handleEnableSound = () => {
    hasIntroduced = true;
    setStarted(true);
    useAppStore.getState().updateSettings({ muted: false });
    audioEngine.unlock(false);
    audioEngine.setMuted(false);
    audioEngine.playUiTick();
    playIntro();
  };

  const handleStaySilent = () => {
    hasIntroduced = true;
    setStarted(true);
    useAppStore.getState().updateSettings({ muted: true });
    audioEngine.unlock(true);
    audioEngine.setMuted(true);
  };

  const handleStartTour = () => {
    stopIntro();
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    startTour(0);
  };

  const handleFreeExplore = () => {
    stopIntro();
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    enterExplore(false);
    if (isMars) {
      void cameraBus.flyOverview(18, 77, 2.75);
    } else {
      void cameraBus.flyOverview(8, 12, 2.55);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-space-950/95 via-space-950/40 to-transparent p-5 sm:p-10 lg:justify-center lg:bg-gradient-to-r lg:from-space-950/95 lg:via-space-950/65 lg:to-transparent lg:pl-14">
      <div className="animate-hud-fade-up pointer-events-auto w-full max-w-lg">
        {/* Editorial Headline — Clean, Solid High-Contrast Typography */}
        <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-regolith-bright sm:text-5xl">
          Abandoned,{" "}
          <span className="font-normal text-regolith/85 italic">
            Not Forgotten.
          </span>
        </h1>

        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-regolith/80">
          {isMars
            ? "11 robotic pioneers—from the Viking landers to Spirit, Opportunity, InSight, and Ingenuity—resting across the red plains of Mars."
            : "20 historic landers, rovers, and science stations resting untouched across the lunar plains since 1966."}
        </p>

        {/* Host portrait — doubles as the replay button once the visitor has chosen a sound preference */}
        <div className="relative mt-5 inline-flex border border-loro/45 bg-space-950/90 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-loro" />
          <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-loro" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-loro" />
          <span className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-loro" />

          <button
            type="button"
            onClick={handleEnableSound}
            className="cursor-pointer focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            title="Hear Surveyor 3's introduction"
            aria-label="Hear Surveyor 3's introduction"
          >
            <LoRo size="xl" />
          </button>
        </div>

        {/* Sound permission: a click is the only "permission" browsers grant, so ask plainly. */}
        {started ? (
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleStartTour}
              className="group inline-flex flex-1 cursor-pointer items-center justify-between gap-3 border border-regolith-bright bg-regolith-bright px-5 py-3.5 text-left text-space-950 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-space-950/65 uppercase">
                  01 · NARRATED {isMars ? "MARS" : "LUNAR"} EXPEDITION
                </div>
                <div className="mt-0.5 font-display text-sm font-bold">
                  Start {isMars ? "Mars" : "Moon"} Tour (5 Chapters)
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={handleFreeExplore}
              className="group inline-flex cursor-pointer items-center justify-between gap-3 border border-white/20 bg-space-950/75 px-5 py-3.5 text-left text-regolith-bright backdrop-blur-md transition hover:border-regolith-bright hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-regolith/60 uppercase">
                  02 · SANDBOX
                </div>
                <div className="mt-0.5 font-display text-sm font-semibold">
                  Free Orbit
                </div>
              </div>
              <Compass className="h-4 w-4 shrink-0 text-sunlit" />
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleEnableSound}
              className="group inline-flex flex-1 cursor-pointer items-center justify-between gap-3 border border-regolith-bright bg-regolith-bright px-5 py-3.5 text-left text-space-950 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-space-950/65 uppercase">
                  SOUND ON
                </div>
                <div className="mt-0.5 font-display text-sm font-bold">
                  Turn on audio
                </div>
              </div>
              <Volume2 className="h-4 w-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleStaySilent}
              className="group inline-flex cursor-pointer items-center justify-between gap-3 border border-white/20 bg-space-950/75 px-5 py-3.5 text-left text-regolith-bright backdrop-blur-md transition hover:border-regolith-bright hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-regolith/60 uppercase">
                  NO SOUND
                </div>
                <div className="mt-0.5 font-display text-sm font-semibold">
                  Stay silent
                </div>
              </div>
              <VolumeX className="h-4 w-4 shrink-0 text-regolith/70" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
