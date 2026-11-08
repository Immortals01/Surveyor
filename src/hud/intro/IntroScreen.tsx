import { Compass, Play, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { audioEngine } from "@/audio/AudioEngine";
import { cameraBus } from "@/engine/camera";
import LoRo from "@/hud/character/LoRo";
import { useAppStore } from "@/store/useAppStore";

export default function IntroScreen() {
  const settings = useAppStore((s) => s.settings);
  const startTour = useAppStore((s) => s.startTour);
  const enterExplore = useAppStore((s) => s.enterExplore);

  const handleStartTour = () => {
    audioEngine.unlock(settings.muted);
    audioEngine.playUiTick(1040);
    startTour(0);
  };

  const handleFreeExplore = () => {
    audioEngine.unlock(settings.muted);
    audioEngine.playUiTick(780);
    enterExplore(false);
    void cameraBus.flyOverview(8, 12, 2.55);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-8 lg:justify-center lg:pl-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="pointer-events-auto max-w-xl rounded-3xl border border-loro/35 bg-space-950/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-7"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-loro/35 bg-loro/10 px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-loro uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>2026 NASA Space Apps · Open Lunar Archive</span>
        </div>

        <h1 className="font-display text-3xl leading-tight font-bold tracking-tight text-regolith-bright sm:text-4xl">
          Abandoned,{" "}
          <span className="bg-gradient-to-r from-sunlit via-amber-200 to-loro bg-clip-text text-transparent">
            Not Forgotten
          </span>
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-regolith/90 sm:text-base">
          Resting silently across the Moon are parked electric buggies, gold
          lander bases, moonquake ears, and quartz mirrors left behind since
          1964—still waiting to tell their stories.
        </p>

        {/* Lo-Ro Character Greeting Card */}
        <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-space-900/75 p-4 sm:flex-row">
          <LoRo size="lg" />
          <div className="text-center sm:text-left">
            <p className="font-mono text-xs font-semibold tracking-wider text-loro uppercase">
              Hi! I&apos;m Lo-Ro — Your Orbital Guide
            </p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-regolith-bright">
              &ldquo;Since 2009, I&apos;ve circled the Moon taking high-res
              photos of all my quiet old robot and Apollo friends in the dust
              below. Ready to swoop down and hear their memories?&rdquo;
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleStartTour}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-loro to-sky-300 px-6 py-3.5 font-display text-sm font-bold text-space-950 shadow-[0_0_30px_rgba(92,225,255,0.35)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Start Guided Story Tour (5 Chapters)</span>
          </button>

          <button
            type="button"
            onClick={handleFreeExplore}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-regolith/30 bg-white/5 px-5 py-3.5 font-display text-sm font-semibold text-regolith-bright transition hover:border-loro/60 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          >
            <Compass className="h-4 w-4 text-sunlit" />
            <span>Free Explore</span>
          </button>
        </div>

        <p className="mt-3.5 text-center font-mono text-[11px] text-regolith/60 sm:text-left">
          16K NASA LRO WAC Mosaic · LOLA Laser Elevation · 29 Verified Artifacts
        </p>
      </motion.div>
    </div>
  );
}
