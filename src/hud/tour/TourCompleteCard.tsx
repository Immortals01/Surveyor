import { ArrowRight, Compass, Radio } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

export default function TourCompleteCard() {
  const tourComplete = useAppStore((s) => s.tourComplete);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const setTourComplete = useAppStore((s) => s.setTourComplete);

  if (!tourComplete) return null;

  const isMoon = celestialBody === "moon";
  const nextBody = isMoon ? "mars" : "moon";

  const startNext = () => {
    audioEngine.playUiTick();
    const state = useAppStore.getState();
    state.setTourComplete(false);
    state.setActiveBody(nextBody);
    state.startTour(0);
  };

  const keepExploring = () => {
    audioEngine.playUiTick();
    setTourComplete(false);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      role="dialog"
      aria-label="Guided tour complete"
    >
      <div className="pointer-events-auto relative w-full max-w-md border border-loro/45 bg-space-950/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-5">
        <span className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-loro" />
        <span className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-loro" />
        <span className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-loro" />
        <span className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-loro" />

        <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.16em] text-loro uppercase">
          <Radio className="h-3.5 w-3.5" />
          Transmission complete
        </div>

        <h2 className="mt-1.5 font-display text-xl leading-tight font-bold text-regolith-bright">
          {isMoon ? "Moon guide complete" : "Mars guide complete"}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-regolith/80">
          {isMoon
            ? "You have followed every lunar chapter. There is another set of machines waiting on the Red Planet."
            : "You have met every Red Planet pioneer. The original lunar trail is still waiting below."}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={startNext}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border border-loro/50 bg-loro/15 px-3 py-2 font-mono text-[10.5px] font-bold tracking-[0.12em] text-regolith-bright uppercase transition hover:border-loro hover:bg-loro/25 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          >
            {isMoon ? "Start the Mars guide" : "Start the Moon guide"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={keepExploring}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-2 font-mono text-[10.5px] tracking-[0.12em] text-regolith uppercase transition hover:border-white/35 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          >
            <Compass className="h-3.5 w-3.5" />
            Explore freely
          </button>
        </div>
      </div>
    </div>
  );
}
