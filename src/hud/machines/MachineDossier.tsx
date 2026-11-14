import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  CalendarClock,
  ExternalLink,
  FlaskConical,
  Images,
  Milestone,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { stopMachineNarration, useMachineNarration } from "@/audio/machineNarration";
import { cancelSpeech } from "@/audio/speech";
import { getMachine, MACHINE_TABS, type MachineTab } from "@/data/machines";
import { cameraBus } from "@/engine/camera";
import { useAppStore } from "@/store/useAppStore";

const MachineStage = lazy(() => import("@/hud/character/machines/MachineStage"));

const TAB_ICONS: Record<MachineTab, typeof BookOpen> = {
  story: BookOpen,
  science: FlaskConical,
  pictures: Images,
  facts: CalendarClock,
  more: Sparkles,
};

interface MachineDossierProps {
  machineId?: string;
  /** Rendered inside the site drawer instead of as its own fixed panel. */
  embedded?: boolean;
  /** Site markers do not start audio; clicking the character itself does. */
  autoPlay?: boolean;
}

export default function MachineDossier({
  machineId,
  embedded = false,
  autoPlay,
}: MachineDossierProps) {
  const selectedMachineId = useAppStore((s) => s.selectedMachineId);
  const tab = useAppStore((s) => s.machineTab);
  const setMachineTab = useAppStore((s) => s.setMachineTab);
  const closeMachine = useAppStore((s) => s.closeMachine);
  const muted = useAppStore((s) => s.settings.muted);
  const openSources = useAppStore((s) => s.openSources);

  const machine = getMachine(machineId ?? selectedMachineId);
  const shouldAutoPlay = autoPlay ?? !embedded;
  const narration = useMachineNarration(machine);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const startedRef = useRef<string | null>(null);
  const storyScrollRef = useRef<HTMLDivElement>(null);

  // Start the character's own story as soon as its panel opens, and stop the
  // voice immediately when the panel closes or another machine is selected.
  useEffect(() => {
    if (!machine) return;
    if (startedRef.current === machine.id) return;
    startedRef.current = machine.id;
    // Embedded machine cards open automatically when a tour selects their site.
    // Cancelling here would cut off the host line that is currently speaking.
    if (!embedded) cancelSpeech();
    audioEngine.unlock(useAppStore.getState().settings.muted);
    const timer = shouldAutoPlay ? window.setTimeout(() => narration.play(0), 320) : 0;
    return () => {
      if (timer) window.clearTimeout(timer);
      narration.stop();
      stopMachineNarration();
      startedRef.current = null;
    };
    // narration is intentionally not a dep: it is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine?.id, shouldAutoPlay]);

  // Muting or disabling voice must silence the character immediately.
  useEffect(() => {
    if (muted) narration.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // Escape closes a full-screen photo before the panel itself.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setLightbox(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightbox]);

  // Keep the highlighted sentence in view while the voice reads.
  useEffect(() => {
    if (narration.activeIndex < 0 || !machine) return;
    document
      .getElementById(`${machine.id}-sentence-${narration.activeIndex}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [narration.activeIndex, machine]);

  if (!machine) return null;

  const Shell = embedded ? "section" : "aside";
  const isMars = machine.body === "mars";
  const isElsewhere = machine.body === "belt";
  const cornerColor = isElsewhere
    ? "border-loro"
    : isMars
      ? "border-orange-400"
      : "border-sunlit";
  const accent = machine.accent;
  const started = narration.activeIndex >= 0 || narration.isPlaying || narration.isFinished;

  const handleClose = () => {
    audioEngine.playUiTick(660);
    narration.stop();
    stopMachineNarration();
    closeMachine();
    useAppStore.getState().setDialogue(null);
    void cameraBus.goHome();
  };

  const togglePlay = () => {
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

  return (
    <Shell
      aria-label={`${machine.name} dossier`}
      className={
        embedded
          ? "flex flex-col"
          : "animate-hud-fade-up pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[78dvh] flex-col overflow-hidden border-t border-white/20 bg-space-950/96 shadow-[0_-24px_70px_rgba(0,0,0,0.92)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[440px] lg:border"
      }
    >
      {!embedded && (
        <>
          <span className={`pointer-events-none absolute -top-px -left-px z-20 h-3 w-3 border-t-2 border-l-2 ${cornerColor}`} />
          <span className={`pointer-events-none absolute -top-px -right-px z-20 h-3 w-3 border-t-2 border-r-2 ${cornerColor}`} />
          <span className={`pointer-events-none absolute -bottom-px -left-px z-20 h-3 w-3 border-b-2 border-l-2 ${cornerColor}`} />
          <span className={`pointer-events-none absolute -right-px -bottom-px z-20 h-3 w-3 border-r-2 border-b-2 ${cornerColor}`} />
          <div className="mx-auto mt-2 h-0.5 w-10 shrink-0 bg-white/25 lg:hidden" />
        </>
      )}

      {/* Header: identity + icon tabs top-right + close */}
      <div className="shrink-0 border-b border-white/15 bg-space-950/92 px-4 pt-2.5 pb-3 lg:px-5 lg:pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9.5px] font-bold tracking-[0.16em] uppercase">
              <span className="text-regolith/55">{machine.launch.date.split(" ").slice(-1)[0]}</span>
              {isElsewhere && (
                <span className="border border-loro/60 bg-loro/10 px-1.5 py-0.5 text-loro">
                  Elsewhere
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display text-[21px] leading-[1.1] font-bold tracking-tight text-regolith-bright">
              {machine.name}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-regolith/65">
              {machine.tagline}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!embedded && (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase transition hover:border-regolith-bright hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              aria-label="Close machine story panel"
              title="Close (Esc)"
            >
              <span className="hidden sm:inline">ESC</span>
              <X className="h-3.5 w-3.5" />
            </button>
            )}
          </div>
        </div>

        {/* Icon tabs — top-right, next to close, wrapping safely on small screens */}
        <div
          role="tablist"
          aria-label={`${machine.name} sections`}
          className="mt-2.5 grid grid-cols-5 items-stretch gap-1"
        >
          {MACHINE_TABS.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={item.label}
                title={item.label}
                onClick={() => {
                  audioEngine.playUiTick(active ? 720 : 880);
                  setMachineTab(item.id);
                }}
                className={`group flex cursor-pointer flex-col items-center justify-start gap-1 border px-1 py-1.5 font-mono text-[8.5px] leading-[1.15] font-bold tracking-[0.04em] uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                  active
                    ? "border-transparent text-space-950"
                    : "border-white/12 bg-white/[0.03] text-regolith/75 hover:border-white/30 hover:text-white"
                }`}
                style={active ? { backgroundColor: accent } : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className={embedded ? "" : "hud-scroll flex-1 overflow-y-auto"}>
        {tab === "story" && (
          <div className="space-y-4 p-4 lg:p-5" ref={storyScrollRef}>
            <div className="flex items-start justify-center gap-3 border border-white/12 bg-gradient-to-br from-white/[0.05] to-transparent p-2.5">
              <Suspense
                fallback={
                  <div className="flex h-40 w-40 items-center justify-center font-display text-lg font-black" style={{ color: accent }}>
                    {machine.name}
                  </div>
                }
              >
                <MachineStage
                  machine={machine}
                  size="lg"
                  isSpeaking={narration.isPlaying}
                  active
                />
              </Suspense>
            </div>

            {/* Player */}
            <div className="flex items-center gap-2 border border-white/12 bg-space-900/60 p-2">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                style={{
                  borderColor: accent,
                  backgroundColor: narration.isPlaying ? accent : "transparent",
                  color: narration.isPlaying ? "#05070d" : accent,
                }}
                title={narration.isPlaying ? "Pause story" : "Play story"}
              >
                {narration.isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{narration.isFinished ? "Play again" : started ? "Resume" : "Play story"}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.unlock(useAppStore.getState().settings.muted);
                  narration.replay();
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-regolith uppercase transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                title="Replay from the beginning"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Replay</span>
              </button>
              <span className="ml-auto inline-flex items-center gap-1 font-mono text-[9.5px] tracking-wider text-regolith/50 uppercase">
                {muted ? <VolumeX className="h-3 w-3 text-alert" /> : <Volume2 className="h-3 w-3 text-loro" />}
                {muted ? "Muted" : narration.isPlaying ? "Speaking" : narration.isPaused ? "Paused" : "Ready"}
              </span>
            </div>

            {/* First-person story with live sentence highlight */}
            <div className="space-y-2">
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // {machine.name.toUpperCase()} SPEAKS
              </p>
              <blockquote className="space-y-2 border-l-2 pl-3" style={{ borderColor: accent }}>
                {machine.story.map((sentence, index) => {
                  const active = index === narration.activeIndex;
                  return (
                    <button
                      key={sentence.id}
                      id={`${machine.id}-sentence-${index}`}
                      type="button"
                      onClick={() => {
                        audioEngine.unlock(useAppStore.getState().settings.muted);
                        narration.play(index);
                      }}
                      aria-current={active ? "true" : undefined}
                      className={`block w-full cursor-pointer rounded-sm px-1.5 py-0.5 text-left font-body text-[13.5px] leading-[1.62] transition-colors focus-visible:ring-1 focus-visible:ring-loro focus-visible:outline-none ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-regolith-bright/85 hover:bg-white/[0.04]"
                      }`}
                    >
                      {sentence.text}
                    </button>
                  );
                })}
              </blockquote>
            </div>

            <div className="border border-white/12 bg-space-900/50 p-3">
              <p className="font-mono text-[9.5px] font-bold tracking-[0.16em] uppercase" style={{ color: accent }}>
                {machine.status.state} · {machine.status.date}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-regolith/75">{machine.status.detail}</p>
            </div>
          </div>
        )}

        {tab === "science" && (
          <div className="space-y-4 p-4 lg:p-5">
            <Section label="01 // WHY IT WAS SENT">
              <p>{machine.purpose.why}</p>
            </Section>
            <Section label="02 // THE SCIENCE">
              <p>{machine.purpose.science}</p>
            </Section>
            <Section label="03 // INSTRUMENTS & HOW IT WORKED">
              <ul className="space-y-1.5">
                {machine.purpose.instruments.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full" style={{ background: accent }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section label="04 // KEY DISCOVERIES">
              <ul className="space-y-1.5">
                {machine.purpose.discoveries.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-sunlit" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section label="05 // IMPACT">
              <p>{machine.purpose.impact}</p>
            </Section>
          </div>
        )}

        {tab === "pictures" && (
          <div className="space-y-3 p-4 lg:p-5">
            <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
              NASA IMAGE GALLERY · {machine.gallery.length} PLATES
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {machine.gallery.map((image, index) => (
                <figure key={image.nasaId} className="border border-white/12 bg-space-900 p-1.5">
                  <button
                    type="button"
                    onClick={() => setLightbox(index)}
                    className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden border border-white/10 bg-space-950 focus-visible:ring-1 focus-visible:ring-loro focus-visible:outline-none"
                    title="Open full image"
                  >
                    <img
                      src={image.src}
                      alt={image.caption}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-1.5 left-1.5 border border-sunlit/50 bg-space-950/85 px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wider text-sunlit uppercase backdrop-blur-sm">
                      {image.year}
                    </span>
                  </button>
                  <figcaption className="mt-1.5 space-y-1 pb-0.5">
                    <p className="text-[11.5px] leading-snug text-regolith-bright/85">{image.caption}</p>
                    <p className="font-mono text-[8.5px] tracking-[0.1em] text-regolith/50 uppercase">
                      Credit: {image.credit} · {image.nasaId}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="border-t border-white/10 pt-2 font-mono text-[9px] leading-relaxed tracking-wider text-regolith/45 uppercase">
              All imagery courtesy NASA Image and Video Library (images.nasa.gov). Public domain unless noted.
            </p>
          </div>
        )}

        {tab === "facts" && (
          <div className="space-y-4 p-4 lg:p-5">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // MISSION TIMELINE
              </p>
              <ol className="mt-2 space-y-0">
                {machine.timeline.map((item, index) => (
                  <li key={`${item.date}-${item.title}`} className="relative flex gap-3 pb-3.5 pl-4">
                    {index < machine.timeline.length - 1 && (
                      <span className="absolute top-4 bottom-0 left-[3px] w-px bg-white/20" />
                    )}
                    <span
                      className="absolute top-1.5 left-0 h-[7px] w-[7px] rounded-full"
                      style={{ background: accent }}
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase" style={{ color: accent }}>
                        {item.date}
                      </p>
                      <p className="mt-0.5 font-display text-[13.5px] font-semibold text-regolith-bright">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-regolith/70">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-white/10 pt-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                02 // LAUNCH & ARRIVAL
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-[12px]">
                <FactRow label="Launch" value={`${machine.launch.date} · ${machine.launch.site}`} />
                <FactRow label="Rocket" value={machine.launch.vehicle} />
                {machine.arrivals.map((arrival) => (
                  <FactRow
                    key={`${arrival.label}-${arrival.date}`}
                    label={arrival.label}
                    value={`${arrival.date} · ${arrival.site}`}
                  />
                ))}
                <FactRow label="Current state" value={`${machine.status.state} · ${machine.status.date}`} />
              </dl>
            </div>

            <div className="border-t border-white/10 pt-3">
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                03 // FUN FACTS
              </p>
              <ul className="mt-2 space-y-1.5">
                {machine.facts.map((fact) => (
                  <li key={fact} className="flex gap-2 text-[12.5px] leading-relaxed text-regolith/80">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0" style={{ color: accent }} />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "more" && (
          <div className="space-y-4 p-4 lg:p-5">
            <Section label="01 // TRIVIA">
              <ul className="space-y-1.5">
                {machine.facts.map((fact) => (
                  <li key={fact} className="flex gap-2">
                    <Milestone className="mt-0.5 h-3 w-3 shrink-0 text-sunlit" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section label="02 // NASA SOURCES & LINKS">
              <div className="space-y-1.5">
                {machine.links.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 border border-white/12 bg-white/[0.03] px-2.5 py-2 text-[12px] text-regolith-bright/90 transition hover:border-loro hover:bg-loro/10 hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-loro" />
                  </a>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {machine.sourceIds.map((sourceId) => (
                  <button
                    key={sourceId}
                    type="button"
                    onClick={() => openSources(sourceId)}
                    className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] tracking-wider text-loro transition hover:border-loro hover:bg-loro/15 hover:text-white"
                  >
                    {sourceId}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="03 // PLACEMENT">
              <dl className="grid grid-cols-1 gap-2 text-[12px]">
                <FactRow label="Body" value={machine.placement.bodyLabel} />
                <FactRow label="Region" value={machine.placement.region} />
                <FactRow label="Coordinates" value={machine.placement.coordinatesLabel} />
                {isElsewhere && (
                  <FactRow
                    label="Note"
                    value="Dawn is not on Mars. It is shown here as an 'elsewhere' object at Ceres, in the main asteroid belt."
                  />
                )}
              </dl>
            </Section>
          </div>
        )}

      </div>

      {/* Lightbox */}
      {lightbox !== null && machine.gallery[lightbox] && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/92 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={machine.gallery[lightbox].caption}
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 border border-white/15 bg-space-950 px-3 py-2">
              <p className="min-w-0 truncate font-mono text-[10px] tracking-[0.12em] text-sunlit uppercase">
                {machine.gallery[lightbox].nasaId}
              </p>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="cursor-pointer border border-white/15 p-1 text-regolith transition hover:border-white/40 hover:text-white"
                aria-label="Close image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={machine.gallery[lightbox].src}
              alt={machine.gallery[lightbox].caption}
              className="max-h-[72dvh] w-full border border-t-0 border-white/15 object-contain"
            />
            <div className="border border-t-0 border-white/15 bg-space-950 p-3">
              <p className="text-[13px] text-regolith-bright/90">{machine.gallery[lightbox].caption}</p>
              <p className="mt-1 font-mono text-[9px] tracking-wider text-regolith/50 uppercase">
                Credit: {machine.gallery[lightbox].credit} · NASA Image and Video Library
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Shell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
        {label}
      </p>
      <div className="font-body text-[13.5px] leading-[1.65] text-regolith-bright/90">{children}</div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 border-b border-white/8 pb-1.5">
      <dt className="font-mono text-[9.5px] tracking-[0.1em] text-regolith/50 uppercase">{label}</dt>
      <dd className="text-[12px] leading-snug text-regolith-bright/85">{value}</dd>
    </div>
  );
}
