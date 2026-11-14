import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { audioEngine } from "@/audio/AudioEngine";
import {
  stopDeepSpaceNarration,
  useDeepSpaceNarration,
} from "@/audio/deepSpaceNarration";
import { deepSpaceParagraphDomId } from "@/audio/deepSpaceVoices";
import {
  DEEP_SPACE_ACCENTS,
  DEEP_SPACE_ENTRIES,
  type DeepSpaceEntry,
} from "@/data/deepSpace";
import { SOURCES_BY_ID } from "@/data/sources";
import { useAppStore } from "@/store/useAppStore";
import DeepSpaceArt from "./DeepSpaceArt";
import DeepSpaceStarfield from "./DeepSpaceStarfield";

interface DeepSpaceStoryProps {
  entry: DeepSpaceEntry;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}

export default function DeepSpaceStory({
  entry,
  onClose,
  onNavigate,
}: DeepSpaceStoryProps) {
  const accent = DEEP_SPACE_ACCENTS[entry.id] ?? "#5ce1ff";
  const index = DEEP_SPACE_ENTRIES.findIndex((item) => item.id === entry.id);
  const openSources = useAppStore((s) => s.openSources);
  const narration = useDeepSpaceNarration(entry);

  // Keep the section being read in view while the voice moves through the log.
  useEffect(() => {
    if (narration.activeIndex < 0) return;
    document
      .getElementById(deepSpaceParagraphDomId(entry.id, narration.activeIndex))
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [narration.activeIndex, entry.id]);

  const toggleNarration = () => {
    audioEngine.unlock(useAppStore.getState().settings.muted);
    if (narration.isPlaying) {
      narration.pause();
      return;
    }
    if (narration.isFinished) {
      narration.replay();
      return;
    }
    narration.play(narration.activeIndex >= 0 ? narration.activeIndex : 0);
  };

  const narrationLabel = narration.isPlaying
    ? "Pause"
    : narration.isFinished
      ? "Replay log"
      : "Listen to log";

  return (
    <section
      className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-space-950"
      role="dialog"
      aria-modal="true"
      aria-label={`Deep space story: ${entry.name}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="fixed inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/images/deep-space/space-bg.webp')" }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_24%,rgba(4,6,11,0.72)_78%,rgba(3,5,9,0.94)_100%)]" />
      <DeepSpaceStarfield />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pt-20 pb-5 sm:px-6 sm:pt-24">
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playUiTick(760);
              stopDeepSpaceNarration();
              onClose();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/80 px-2.5 py-2 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase backdrop-blur-md transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Back to deep space objects"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to objects</span>
          </button>

          <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-regolith/50 uppercase">
            <Orbit className="h-3.5 w-3.5 text-loro" />
            Memory file {String(index + 1).padStart(2, "0")} /{" "}
            {String(DEEP_SPACE_ENTRIES.length).padStart(2, "0")}
          </p>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiTick(660);
              stopDeepSpaceNarration();
              onClose();
            }}
            className="cursor-pointer border border-white/15 bg-space-950/80 p-1.5 text-regolith backdrop-blur-md transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close story"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-3 grid flex-1 gap-4 lg:grid-cols-[245px_minmax(0,1fr)_370px] lg:items-center lg:gap-6">
          <aside className="order-3 border border-white/12 bg-space-950/72 p-4 backdrop-blur-md lg:order-1">
            <p className="font-mono text-[9px] tracking-[0.18em] text-regolith/45 uppercase">
              Flight record
            </p>
            <dl className="mt-3 space-y-3">
              {entry.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-mono text-[8px] tracking-[0.16em] text-regolith/40 uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-[12px] leading-snug text-regolith-bright/90">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="font-mono text-[8px] tracking-[0.16em] text-regolith/40 uppercase">
                Present location
              </p>
              <p className="mt-1 text-[11.5px] leading-snug" style={{ color: accent }}>
                {entry.location}
              </p>
            </div>
          </aside>

          <div className="order-1 flex flex-col items-center justify-center py-2 lg:order-2 lg:py-0">
            <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72 lg:h-80 lg:w-80">
              <span
                className="absolute inset-0 rounded-full border border-dashed opacity-35"
                style={{
                  borderColor: accent,
                  animation: "spin 46s linear infinite",
                }}
              />
              <span
                className="absolute inset-7 rounded-full border opacity-20"
                style={{ borderColor: accent }}
              />
              <span
                className="absolute inset-14 rounded-full blur-3xl"
                style={{ backgroundColor: `${accent}22` }}
              />
              <div className="animate-deep-float relative h-44 w-44 sm:h-60 sm:w-60 lg:h-64 lg:w-64">
                <DeepSpaceArt id={entry.id} />
              </div>
            </div>

            <div className="mt-1 text-center">
              <p className="font-mono text-[8.5px] tracking-[0.24em] uppercase" style={{ color: accent }}>
                {entry.status}
              </p>
              <h1 className="mt-1 font-display text-2xl leading-tight font-bold text-regolith-bright sm:text-3xl">
                {entry.name}
              </h1>
            </div>
          </div>

          <article className="order-2 border border-white/12 bg-space-950/72 p-5 backdrop-blur-md lg:order-3">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
              <p className="font-mono text-[9px] tracking-[0.18em] text-regolith/45 uppercase">
                Memory log
              </p>
              <button
                type="button"
                onClick={toggleNarration}
                aria-pressed={narration.isPlaying}
                aria-label={`${narrationLabel} — read by the object itself`}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-regolith uppercase transition hover:border-loro hover:bg-loro/15 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              >
                {narration.isPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : narration.isFinished ? (
                  <RotateCcw className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span>{narrationLabel}</span>
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {entry.story.map((paragraph, paragraphIndex) => {
                const isActive = narration.activeIndex === paragraphIndex;
                return (
                  <button
                    key={paragraph.slice(0, 24)}
                    id={deepSpaceParagraphDomId(entry.id, paragraphIndex)}
                    type="button"
                    onClick={() => {
                      audioEngine.unlock(useAppStore.getState().settings.muted);
                      narration.play(paragraphIndex);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={`block w-full cursor-pointer rounded-sm border-l-2 py-1.5 pr-1.5 pl-2.5 text-left text-[13px] leading-[1.72] transition-colors focus-visible:ring-1 focus-visible:ring-loro focus-visible:outline-none ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-regolith-bright/85 hover:bg-white/[0.04]"
                    }`}
                    style={{ borderLeftColor: isActive ? accent : "transparent" }}
                  >
                    {paragraphIndex === 0 ? (
                      <span
                        className="float-left mt-1 mr-1.5 font-display text-[30px] leading-[0.8] font-bold"
                        style={{ color: accent }}
                      >
                        {paragraph.charAt(0)}
                      </span>
                    ) : null}
                    {paragraphIndex === 0 ? paragraph.slice(1) : paragraph}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
              <span className="font-mono text-[9px] tracking-[0.14em] text-regolith/55 uppercase">
                Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {entry.sourceIds.map((sid) => (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => {
                      audioEngine.playUiTick(940);
                      openSources(sid);
                    }}
                    title={SOURCES_BY_ID.get(sid)?.title ?? sid}
                    className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] tracking-wider text-loro transition hover:border-loro hover:bg-loro/15 hover:text-white"
                  >
                    <span>{sid}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            </div>
          </article>
        </div>

        <footer className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playUiTick(880);
              onNavigate(-1);
            }}
            className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-space-950/75 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-regolith uppercase transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Previous deep space object"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Previous object</span>
          </button>

          <div className="flex items-center gap-1.5">
            {DEEP_SPACE_ENTRIES.map((item) => (
              <span
                key={item.id}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    item.id === entry.id
                      ? accent
                      : "rgba(255,255,255,0.22)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiTick(980);
              onNavigate(1);
            }}
            className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-space-950/75 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-regolith uppercase transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Next deep space object"
          >
            <span className="hidden sm:inline">Next object</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </div>
    </section>
  );
}
