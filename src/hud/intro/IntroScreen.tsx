import { ArrowRight, Compass, Volume2 } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { speakLine } from "@/audio/speech";
import { cameraBus } from "@/engine/camera";
import LoRo from "@/hud/character/LoRo";
import { useAppStore } from "@/store/useAppStore";

const MOON_INTRO_VOICE_LINE = {
  id: "loro-tip-1",
  speaker: "loro" as const,
  mood: "waving" as const,
  text: "Click any glowing marker on the Moon, or start the five-chapter guided tour to swoop down and hear what our left-behind spacecraft remember!",
  sourceIds: ["S-SVS-4720", "S-WAGNER-2017"],
};

const EARTH_INTRO_VOICE_LINE = {
  id: "loro-earth-intro",
  speaker: "loro" as const,
  mood: "excited" as const,
  text: "Welcome back to Earth! Explore 24 legendary launch complexes and Mission Control hubs where thousands of space missions began—and track the live International Space Station in orbit!",
  sourceIds: ["S-BLUE-MARBLE", "S-NASA-KSC", "S-NASA-ISS"],
};

export default function IntroScreen() {
  const activeBody = useAppStore((s) => s.activeBody);
  const muted = useAppStore((s) => s.settings.muted);
  const startTour = useAppStore((s) => s.startTour);
  const enterExplore = useAppStore((s) => s.enterExplore);

  const isEarth = activeBody === "earth";

  const handleStartTour = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    startTour(0);
  };

  const handleFreeExplore = () => {
    audioEngine.unlock(muted);
    audioEngine.playUiTick();
    enterExplore(false);
    if (isEarth) {
      void cameraBus.flyOverview(20, -38, 2.75);
    } else {
      void cameraBus.flyOverview(8, 12, 2.55);
    }
  };

  const handlePreviewVoice = () => {
    audioEngine.unlock(false);
    useAppStore.getState().updateSettings({ muted: false });
    void speakLine(isEarth ? EARTH_INTRO_VOICE_LINE : MOON_INTRO_VOICE_LINE);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-space-950/95 via-space-950/40 to-transparent p-5 sm:p-10 lg:justify-center lg:bg-gradient-to-r lg:from-space-950/95 lg:via-space-950/65 lg:to-transparent lg:pl-14">
      <div className="animate-hud-fade-up pointer-events-auto w-full max-w-lg">
        {/* Technical Telemetry Index Eyebrow */}
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-regolith/70 uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sunlit" />
          <span>
            {isEarth ? "EARTH SPACEPORT ARCHIVE" : "SURVEYOR 3 TELEMETRY"}
          </span>
          <span className="text-white/25">·</span>
          <span className="text-loro">
            {isEarth
              ? "LIVE ISS ORBIT (NORAD #25544)"
              : "OCEANUS PROCELLARUM (1967-035A)"}
          </span>
        </div>

        {/* Editorial Headline — Clean, Solid High-Contrast Typography */}
        <h1 className="mt-2.5 font-display text-4xl leading-[1.05] font-bold tracking-tight text-regolith-bright sm:text-5xl">
          {isEarth ? (
            <>
              Where Every{" "}
              <span className="font-normal text-regolith/85 italic">
                Voyage Begins.
              </span>
            </>
          ) : (
            <>
              Abandoned,{" "}
              <span className="font-normal text-regolith/85 italic">
                Not Forgotten.
              </span>
            </>
          )}
        </h1>

        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-regolith/80">
          {isEarth
            ? "Across Earth's coastlines, deserts, and steppes stand 24 historic spaceports, Mission Control centers, and giant radio dishes where thousands of space missions began—while the International Space Station orbits overhead with the Moon in the background."
            : "Across the lunar plains rest three electric rovers, six gold descent stages, seismic stations, and quartz mirror arrays left behind since 1964—preserved in vacuum and still photographed from orbit today."}
        </p>

        {/* Compact Lunar Host Badge */}
        <div className="relative mt-5 inline-flex items-center gap-3.5 border border-loro/45 bg-space-950/90 p-2.5 pr-4 shadow-[0_18px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-loro" />
          <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-loro" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-loro" />
          <span className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-loro" />

          <div
            onClick={handlePreviewVoice}
            className="cursor-pointer"
            title="Click to hear Surveyor 3's voice introduction"
          >
            <LoRo size="md" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-loro uppercase">
              {isEarth
                ? "MISSION HOST · SURVEYOR 3 ON EARTH"
                : "LUNAR HOST · SURVEYOR 3 (1967-035A)"}
            </span>
            <div>
              <button
                type="button"
                onClick={handlePreviewVoice}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-loro/35 bg-loro/10 px-2.5 py-1 font-mono text-[10px] text-loro transition hover:border-loro hover:bg-loro/20 hover:text-white"
                title="Hear Surveyor 3's voice introduction"
              >
                <Volume2 className="h-3 w-3 text-loro" />
                <span>VOICE INTRO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Architectural Action Controls */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleStartTour}
            className="group inline-flex flex-1 cursor-pointer items-center justify-between gap-3 border border-regolith-bright bg-regolith-bright px-5 py-3.5 text-left text-space-950 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-space-950/65 uppercase">
                01 · NARRATED EXPEDITION
              </div>
              <div className="mt-0.5 font-display text-sm font-bold">
                Start Guided Tour (5 Chapters)
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

        {/* Dataset Telemetry Specs Footer */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-3.5 font-mono text-[10px] tracking-wider text-regolith/60 uppercase">
          {isEarth ? (
            <>
              <div>
                <div className="text-regolith-bright">BLUE MARBLE 2K</div>
                <div>NASA EO + CITY LIGHTS</div>
              </div>
              <div>
                <div className="text-regolith-bright">24 SPACE SITES</div>
                <div>LAUNCH &amp; DSN HUBS</div>
              </div>
              <div>
                <div className="text-regolith-bright">ISS LIVE ORBIT</div>
                <div>NORAD #25544 TRACK</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-regolith-bright">NASA SVS #4720</div>
                <div>LRO WAC + LOLA DEM</div>
              </div>
              <div>
                <div className="text-regolith-bright">29 SITES</div>
                <div>WAGNER ET AL. 2017</div>
              </div>
              <div>
                <div className="text-regolith-bright">NSSDCA</div>
                <div>VERIFIED TELEMETRY</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
