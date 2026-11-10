import { useRef, useState } from "react";
import { Eye, MoveHorizontal } from "lucide-react";
import type { HeroSite } from "@/data/schema";

interface ThenNowSliderProps {
  thenNow: HeroSite["thenNow"];
}

export default function ThenNowSlider({ thenNow }: ThenNowSliderProps) {
  const [splitPct, setSplitPct] = useState(48);
  const [showHotspots, setShowHotspots] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const raw = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(2, Math.min(98, raw)));
  };

  return (
    <div className="space-y-4">
      {/* Optical Comparison Frame */}
      <div className="border border-white/15 bg-space-950 p-1.5">
        <div
          ref={containerRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) {
              updateFromClientX(e.clientX);
            }
          }}
          className="relative aspect-[4/3] w-full cursor-ew-resize overflow-hidden border border-white/10 bg-space-900 select-none"
        >
          {/* Bottom Layer: NOW (Orbital Reconnaissance View) */}
          <img
            src={thenNow.nowImage}
            alt={thenNow.nowCaption}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          {/* Orbital Hardware Hotspots */}
          {showHotspots &&
            thenNow.hotspots.map((spot) => (
              <div
                key={spot.label}
                style={{
                  left: `${spot.xPct}%`,
                  top: `${spot.yPct}%`,
                  opacity: splitPct < spot.xPct + 12 ? 1 : 0.16,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
              >
                <span className="relative flex h-5 w-5 items-center justify-center border border-loro bg-space-950/60">
                  <span className="h-1.5 w-1.5 bg-loro" />
                </span>
                <span className="mt-1 block whitespace-nowrap border border-loro/40 bg-space-950/92 px-1.5 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase">
                  {spot.label}
                </span>
              </div>
            ))}

          {/* Top Layer: THEN (Historical Surface Archive), GPU-clipped */}
          <img
            src={thenNow.thenImage}
            alt={thenNow.thenCaption}
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          {/* Architectural Frame Stamps */}
          <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
            SURFACE · {thenNow.thenYear}
          </span>
          <span className="pointer-events-none absolute top-2 right-2 border border-loro/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-loro uppercase backdrop-blur-md">
            ORBITAL · {thenNow.lrocImageId}
          </span>

          {/* Vertical Split Hairline & Precision Reticle Handle */}
          <div
            style={{ left: `${splitPct}%` }}
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-regolith-bright shadow-[0_0_10px_rgba(0,0,0,0.9)]"
          >
            <div className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-regolith-bright bg-space-950 text-regolith-bright shadow-lg">
              <MoveHorizontal className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Control Strip */}
        <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-white/10 px-2 pt-2 pb-0.5">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
            SPLIT RATIO · {Math.round(splitPct)}% / {100 - Math.round(splitPct)}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(splitPct)}
            onChange={(e) => setSplitPct(Number(e.target.value))}
            aria-label="Compare historical surface photo with modern orbital photo"
            className="h-1 flex-1 cursor-pointer accent-regolith-bright"
          />
          {thenNow.hotspots.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHotspots((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-regolith uppercase transition hover:border-loro hover:text-white"
            >
              <Eye className="h-2.5 w-2.5 text-loro" />
              <span>{showHotspots ? "Hide Reticles" : "Show Reticles"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Archival Plate Captions */}
      <div className="divide-y divide-white/10 border border-white/15 bg-space-950/85 text-xs leading-relaxed">
        <div className="p-3.5">
          <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-sunlit uppercase">
            PLATE A · SURFACE ARCHIVE ({thenNow.thenYear})
          </div>
          <p className="mt-1 text-regolith/90">{thenNow.thenCaption}</p>
        </div>
        <div className="p-3.5">
          <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-loro uppercase">
            PLATE B · ORBITAL RECONNAISSANCE ({thenNow.lrocImageId})
          </div>
          <p className="mt-1 text-regolith/90">{thenNow.nowCaption}</p>
        </div>
      </div>
    </div>
  );
}
