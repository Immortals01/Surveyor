import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { getTourChaptersForBody } from "@/data";
import type { TourEvent } from "@/engine/tourEngine";
import { useAppStore } from "@/store/useAppStore";

interface TourBarProps {
  dispatchTour: (event: TourEvent) => void;
}

export default function TourBar({ dispatchTour }: TourBarProps) {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const chapterIndex = useAppStore((s) => s.tourChapterIndex);
  const beatIndex = useAppStore((s) => s.tourBeatIndex);
  const tourPaused = useAppStore((s) => s.tourPaused);
  const startTour = useAppStore((s) => s.startTour);

  const chapters = getTourChaptersForBody(celestialBody);
  const activeChapter = chapters[chapterIndex];
  const activeBeat = activeChapter?.beats[beatIndex];
  const isReprise =
    activeBeat?.kind === "flySite" && activeBeat.reprise === true;

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 border border-white/15 bg-space-950/88 px-3 py-1.5 backdrop-blur-md">
      {/* 5 Chapter Selector Pills */}
      <div
        className="flex items-center gap-1"
        role="tablist"
        aria-label="Story Tour Chapters"
      >
        {chapters.map((ch, idx) => {
          const isCurrent = idx === chapterIndex;
          const isDone = idx < chapterIndex;
          return (
            <button
              key={ch.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => {
                audioEngine.playUiTick();
                startTour(idx);
              }}
              className={`cursor-pointer px-2.5 py-1 font-mono text-[11px] font-medium uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                isCurrent
                  ? "bg-regolith-bright font-bold text-space-950"
                  : isDone
                    ? "border border-white/20 bg-white/8 text-regolith-bright hover:bg-white/15"
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

      {isReprise && (
        <span
          className="border border-loro/40 bg-loro/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-loro uppercase"
          title="Previously visited site"
        >
          Legacy stop
        </span>
      )}

      <span className="hidden h-4 w-px bg-white/15 md:inline-block" />

      {/* Beat Step Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick();
            dispatchTour({ type: "PREV_BEAT" });
          }}
          className="cursor-pointer p-1.5 text-regolith hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label="Previous tour beat"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick();
            dispatchTour({ type: tourPaused ? "RESUME" : "PAUSE" });
          }}
          className="cursor-pointer border border-white/15 bg-white/8 px-2.5 py-1 font-mono text-[11px] text-regolith-bright hover:border-loro/50 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label={tourPaused ? "Resume tour" : "Pause tour"}
        >
          {tourPaused ? (
            <span className="inline-flex items-center gap-1 text-sunlit">
              <Play className="h-3 w-3 fill-current" /> RESUME
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Pause className="h-3 w-3" />{" "}
              {activeChapter
                ? `${beatIndex + 1}/${activeChapter.beats.length}`
                : "PAUSE"}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playUiTick();
            dispatchTour({ type: "NEXT_BEAT" });
          }}
          className="cursor-pointer p-1.5 text-regolith hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
          aria-label="Next tour beat"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          audioEngine.playUiTick();
          dispatchTour({ type: "EXIT_TO_EXPLORE" });
        }}
        className="inline-flex cursor-pointer items-center gap-1 border border-sunlit/35 bg-sunlit/10 px-2.5 py-1 font-mono text-[11px] font-medium text-sunlit uppercase transition hover:bg-sunlit/20 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
        title="Switch to Free Explore mode"
      >
        <Compass className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Free Orbit</span>
      </button>
    </div>
  );
}
