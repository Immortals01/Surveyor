import { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { TOUR_CHAPTERS } from "@/data";
import type { TourEvent } from "@/engine/tourEngine";
import { useAppStore } from "@/store/useAppStore";

interface TourBarProps {
  dispatchTour: (event: TourEvent) => void;
}

export default function TourBar({ dispatchTour }: TourBarProps) {
  const chapterIndex = useAppStore((s) => s.tourChapterIndex);
  const beatIndex = useAppStore((s) => s.tourBeatIndex);
  const tourPaused = useAppStore((s) => s.tourPaused);
  const startTour = useAppStore((s) => s.startTour);

  const activeChapter = TOUR_CHAPTERS[chapterIndex];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatchTour({ type: "NEXT_BEAT" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        dispatchTour({ type: "PREV_BEAT" });
      } else if (e.key === "Escape") {
        dispatchTour({ type: "EXIT_TO_EXPLORE" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatchTour]);

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-loro/35 bg-space-950/88 px-3 py-1.5 shadow-xl backdrop-blur-xl">
      {/* 5 Chapter Selector Pills */}
      <div className="flex items-center gap-1" role="tablist" aria-label="Story Tour Chapters">
        {TOUR_CHAPTERS.map((ch, idx) => {
          const isCurrent = idx === chapterIndex;
          const isDone = idx < chapterIndex;
          return (
            <button
              key={ch.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => {
                audioEngine.playUiTick(920);
                startTour(idx);
              }}
              className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                isCurrent
                  ? "bg-loro font-bold text-space-950"
                  : isDone
                    ? "bg-loro/20 text-loro hover:bg-loro/30"
                    : "text-regolith/70 hover:bg-white/10 hover:text-white"
              }`}
              title={ch.title}
            >
              <span className="hidden sm:inline">{ch.shortTitle}</span>
              <span className="sm:hidden">{ch.number}</span>
            </button>
          );
        })}
      </div>

      <span className="hidden h-4 w-px bg-white/15 md:inline-block" />

      {/* Beat Step Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick(740);
            dispatchTour({ type: "PREV_BEAT" });
          }}
          className="cursor-pointer rounded-full p-1.5 text-regolith hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label="Previous tour beat"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick(860);
            dispatchTour({ type: tourPaused ? "RESUME" : "PAUSE" });
          }}
          className="cursor-pointer rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[11px] text-regolith-bright hover:border-loro/50 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label={tourPaused ? "Resume tour" : "Pause tour"}
        >
          {tourPaused ? (
            <span className="inline-flex items-center gap-1 text-sunlit">
              <Play className="h-3 w-3 fill-current" /> Resume
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Pause className="h-3 w-3" />{" "}
              {activeChapter ? `${beatIndex + 1}/${activeChapter.beats.length}` : "Pause"}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick(980);
            dispatchTour({ type: "NEXT_BEAT" });
          }}
          className="cursor-pointer rounded-full p-1.5 text-regolith hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label="Next tour beat"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          audioEngine.playUiTick(680);
          dispatchTour({ type: "EXIT_TO_EXPLORE" });
        }}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-sunlit/35 bg-sunlit/10 px-2.5 py-1 font-mono text-[11px] font-medium text-sunlit transition hover:bg-sunlit/20 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
        title="Switch to Free Explore mode"
      >
        <Compass className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Free Roam</span>
      </button>
    </div>
  );
}
