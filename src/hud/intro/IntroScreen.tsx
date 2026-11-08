import { ArrowRight, Compass, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { audioEngine } from "@/audio/AudioEngine";
import { speakLine } from "@/audio/speech";
import { cameraBus } from "@/engine/camera";
import LoRo from "@/hud/character/LoRo";
import { useAppStore } from "@/store/useAppStore";

const INTRO_VOICE_LINE = {
  id: "loro-tip-1",
  speaker: "loro" as const,
  mood: "waving" as const,
  text: "Click any glowing marker on the Moon, or start the five-chapter guided tour to swoop down and hear what our left-behind spacecraft remember!",
  sourceIds: ["S-SVS-4720", "S-WAGNER-2017"],
};

export default function IntroScreen() {
  const settings = useAppStore((s) => s.settings);
  const startTour = useAppStore((s) => s.startTour);
  const enterExplore = useAppStore((s) => s.enterExplore);

  const handleStartTour = () => {
    audioEngine.unlock(settings.muted);
    audioEngine.playUiTick();
    startTour(0);
  };

  const handleFreeExplore = () => {
    audioEngine.unlock(settings.muted);
    audioEngine.playUiTick();
    enterExplore(false);
    void cameraBus.flyOverview(8, 12, 2.55);
  };

  const handlePreviewVoice = () => {
    audioEngine.unlock(false);
    useAppStore.getState().updateSettings({ muted: false });
    void speakLine(INTRO_VOICE_LINE);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-space-950/95 via-space-950/40 to-transparent p-5 sm:p-10 lg:justify-center lg:bg-gradient-to-r lg:from-space-950/95 lg:via-space-950/65 lg:to-transparent lg:pl-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-auto w-full max-w-[490px]"
      >
        {/* Technical Telemetry Index Eyebrow */}
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-regolith/70 uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sunlit" />
          <span>LRO // RECONNAISSANCE ARCHIVE</span>
          <span className="text-white/25">/</span>
          <span className="text-loro">50 KM POLAR ORBIT</span>
        </div>

        {/* Editorial Headline — Clean, Solid High-Contrast Typography */}
        <h1 className="mt-3 font-display text-4xl leading-[1.06] font-bold tracking-tight text-regolith-bright sm:text-5xl">
          Abandoned,
          <br />
          <span className="font-normal text-regolith/85 italic">
            Not Forgotten.
          </span>
        </h1>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-regolith/80">
          Across the lunar plains rest three electric rovers, six gold descent
          stages, seismic stations, and quartz mirror arrays left behind since
          1964—preserved in vacuum and still photographed from orbit today.
        </p>

        {/* Orbital Telemetry Comms Block (Lo-Ro Character Guide) */}
        <div className="relative mt-6 border-y border-white/15 bg-space-950/70 py-4 pr-4 pl-3 backdrop-blur-md">
          {/* Corner technical hairlines */}
          <span className="pointer-events-none absolute -top-px left-0 h-px w-6 bg-loro" />
          <span className="pointer-events-none absolute -bottom-px left-0 h-px w-6 bg-loro" />

          <div className="flex items-start gap-4">
            <LoRo size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-loro uppercase">
                  ORBITAL GUIDE // LRO (&ldquo;LO-RO&rdquo;)
                </span>
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-regolith hover:border-loro hover:text-white"
                  title="Hear Lo-Ro's voice introduction"
                >
                  <Volume2 className="h-2.5 w-2.5 text-loro" />
                  <span>VOICE</span>
                </button>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-regolith-bright/95">
                &ldquo;Since 2009, my Narrow Angle Camera has mapped these landing
                sites down to half a meter per pixel. Select a mission mode below
                to descend to the surface and hear their logs.&rdquo;
              </p>
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
                01 // NARRATED EXPEDITION
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
                02 // SANDBOX
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
        </div>
      </motion.div>
    </div>
  );
}
