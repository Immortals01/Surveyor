import { ArrowUpRight, Orbit, Satellite, X } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { DEEP_SPACE_ENTRIES } from "@/data/deepSpace";
import { useAppStore } from "@/store/useAppStore";

export default function DeepSpaceShelf() {
  const open = useAppStore((s) => s.deepSpaceOpen);
  const setOpen = useAppStore((s) => s.setDeepSpaceOpen);
  const openMachine = useAppStore((s) => s.openMachine);

  if (!open) return null;

  const close = () => {
    audioEngine.playUiTick();
    setOpen(false);
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-space-950/82 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Deep space and elsewhere hardware"
      onClick={close}
    >
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden border border-white/12 bg-space-950 shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-loro uppercase">
              <Orbit className="h-3.5 w-3.5" />
              Deep Space / Elsewhere
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-regolith-bright">
              Hardware beyond the Moon and Mars
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-regolith/70">
              These machines are not parked on either map. They are still out
              there: orbiting, resting, or drifting away.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close deep space shelf"
            title="Close (Esc)"
          >
            <span className="hidden sm:inline">ESC</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="hud-scroll flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {DEEP_SPACE_ENTRIES.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col border border-white/12 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[9px] font-bold tracking-[0.15em] uppercase">
                  <span className="text-regolith/55">{entry.location}</span>
                  {entry.machineId && (
                    <span className="border border-loro/50 bg-loro/10 px-1.5 py-0.5 text-loro">
                      Full dossier
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-display text-lg leading-tight font-bold text-regolith-bright">
                  {entry.name}
                </h3>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-sunlit uppercase">
                  {entry.status}
                </p>
                <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-regolith/75">
                  {entry.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {entry.machineId ? (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playUiTick();
                        setOpen(false);
                        openMachine(entry.machineId!);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 border border-loro/50 bg-loro/15 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-regolith-bright uppercase transition hover:border-loro hover:bg-loro/25 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                    >
                      <Satellite className="h-3.5 w-3.5" />
                      Open story
                    </button>
                  ) : (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-regolith uppercase transition hover:border-sunlit hover:text-sunlit focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                    >
                      NASA mission page
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                  <span className="font-mono text-[9px] tracking-wide text-regolith/40 uppercase">
                    {entry.source}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
