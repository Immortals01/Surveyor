import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Orbit, Satellite, X } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { DEEP_SPACE_ENTRIES, type DeepSpaceEntry } from "@/data/deepSpace";
import { useAppStore } from "@/store/useAppStore";
import DeepSpaceArt from "./DeepSpaceArt";

const POSITIONS: Record<string, { x: number; y: number }> = {
  dawn: { x: 22, y: 30 },
  "near-shoemaker": { x: 64, y: 26 },
  pioneer: { x: 34, y: 64 },
  kepler: { x: 73, y: 61 },
};

const ACCENTS: Record<string, string> = {
  dawn: "#5ce1ff",
  "near-shoemaker": "#ffcf70",
  pioneer: "#f4a261",
  kepler: "#c4b5fd",
};


function ObjectNode({
  entry,
  active,
  onSelect,
  index,
}: {
  entry: DeepSpaceEntry;
  active: boolean;
  onSelect: () => void;
  index: number;
}) {
  const accent = ACCENTS[entry.id] ?? "#5ce1ff";
  const spot = POSITIONS[entry.id] ?? { x: 50, y: 50 };

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        animationDelay: `${index * 0.9}s`,
        borderColor: active ? accent : undefined,
      }}
      className="animate-deep-float group absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center rounded-full border border-transparent text-center transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none sm:h-24 sm:w-24"
      aria-label={`Open details for ${entry.name}`}
    >
      <span
        className="absolute inset-2 -z-10 rounded-full blur-xl transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: `${accent}20`, opacity: active ? 1 : 0.35 }}
      />
      <span className="pointer-events-none h-16 w-16 sm:h-20 sm:w-20">
        <DeepSpaceArt id={entry.id} />
      </span>
      <span className="absolute top-full left-1/2 mt-0.5 w-32 -translate-x-1/2 border border-white/10 bg-space-950/70 px-1.5 py-0.5 backdrop-blur-sm">
        <span className="block font-display text-[11px] leading-tight font-bold text-regolith-bright">
          {entry.name}
        </span>
        <span className="mt-0.5 block font-mono text-[7px] tracking-[0.08em] text-regolith/50 uppercase">
          {entry.location}
        </span>
      </span>
    </button>
  );
}

export default function DeepSpaceShelf() {
  const open = useAppStore((s) => s.deepSpaceOpen);
  const setOpen = useAppStore((s) => s.setDeepSpaceOpen);
  const openMachine = useAppStore((s) => s.openMachine);
  const [selected, setSelected] = useState<DeepSpaceEntry | null>(null);

  if (!open) return null;

  const close = () => {
    audioEngine.playUiTick();
    setSelected(null);
    setOpen(false);
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-20 overflow-hidden bg-space-950"
      role="dialog"
      aria-modal="true"
      aria-label="Deep space and elsewhere hardware"
      onClick={() => setSelected(null)}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.18) 45%, rgba(5,7,13,0.85) 100%), url('/textures/sky/stars_4k.webp')",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-4 pt-24 pb-4 sm:px-6 sm:pt-24">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-loro uppercase">
              <Orbit className="h-3.5 w-3.5" />
              Deep Space / Elsewhere
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-regolith-bright sm:text-2xl">
              Hardware beyond the Moon and Mars
            </h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-regolith/70">
              Select a drifting object to read where it is and what it is still
              doing.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/80 px-2.5 py-2 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase backdrop-blur-md transition hover:border-white/40 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close deep space view"
            title="Back to the map (Esc)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to map</span>
          </button>
        </div>

        <div className="relative mt-4 flex-1 sm:mt-2">
          <div className="absolute inset-0">
            {DEEP_SPACE_ENTRIES.map((entry, index) => (
              <ObjectNode
                key={entry.id}
                entry={entry}
                active={selected?.id === entry.id}
                onSelect={() => {
                  audioEngine.playUiTick(900);
                  setSelected(entry);
                }}
                index={index}
              />
            ))}
          </div>

          {selected && (
            <aside
              className="absolute inset-x-0 bottom-0 z-10 max-h-[62%] overflow-y-auto border border-white/15 bg-space-950/96 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:max-h-full sm:w-[340px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.16em] text-regolith/50 uppercase">
                    Object file
                  </p>
                  <h3 className="mt-1 font-display text-xl leading-tight font-bold text-regolith-bright">
                    {selected.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="cursor-pointer border border-white/15 bg-white/5 p-1 text-regolith transition hover:border-white/40 hover:text-white"
                  aria-label="Close object details"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <dl className="mt-4 space-y-3 text-[12px]">
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-regolith/45 uppercase">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-regolith-bright/85">{selected.location}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-regolith/45 uppercase">
                    Status
                  </dt>
                  <dd className="mt-0.5 text-sunlit">{selected.status}</dd>
                </div>
              </dl>

              <p className="mt-4 text-[13px] leading-relaxed text-regolith/80">
                {selected.summary}
              </p>

              <div className="mt-5 flex flex-col gap-2">
                {selected.machineId ? (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playUiTick();
                      setSelected(null);
                      setOpen(false);
                      openMachine(selected.machineId!);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 border border-loro/50 bg-loro/15 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.12em] text-regolith-bright uppercase transition hover:border-loro hover:bg-loro/25 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                  >
                    <Satellite className="h-3.5 w-3.5" />
                    Open full story
                  </button>
                ) : (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center justify-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-regolith uppercase transition hover:border-sunlit hover:text-sunlit focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
                  >
                    NASA mission page
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
                <p className="text-center font-mono text-[8.5px] tracking-wide text-regolith/40 uppercase">
                  {selected.source}
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
