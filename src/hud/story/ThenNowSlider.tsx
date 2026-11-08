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
    <div className="space-y-3">
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
        className="relative aspect-[4/3] w-full cursor-ew-resize overflow-hidden rounded-2xl border border-white/15 bg-space-900 select-none"
      >
        {/* Bottom Layer: NOW (LROC Orbital View) */}
        <img
          src={thenNow.nowImage}
          alt={thenNow.nowCaption}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* LROC Hardware Hotspots on the orbital layer */}
        {showHotspots &&
          thenNow.hotspots.map((spot) => (
            <div
              key={spot.label}
              style={{
                left: `${spot.xPct}%`,
                top: `${spot.yPct}%`,
                opacity: splitPct < spot.xPct + 12 ? 1 : 0.18,
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
            >
              <span className="block h-5 w-5 rounded-full border-2 border-loro bg-loro/20 shadow-[0_0_10px_#5ce1ff]" />
              <span className="mt-1 block whitespace-nowrap rounded bg-space-950/90 px-1.5 py-0.5 font-mono text-[10px] text-loro shadow">
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

        {/* Corner Labels */}
        <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full border border-sunlit/40 bg-space-950/85 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sunlit backdrop-blur-md">
          THEN · {thenNow.thenYear}
        </span>
        <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-full border border-loro/40 bg-space-950/85 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-loro backdrop-blur-md">
          NOW · LROC ({thenNow.lrocImageId})
        </span>

        {/* Vertical Split Line & Handle */}
        <div
          style={{ left: `${splitPct}%` }}
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-loro bg-space-950 text-loro shadow-lg">
            <MoveHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Keyboard-Accessible Range Input */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(splitPct)}
          onChange={(e) => setSplitPct(Number(e.target.value))}
          aria-label="Compare historical surface photo with modern LROC orbital photo"
          className="h-1.5 flex-1 cursor-pointer accent-loro"
        />
        {thenNow.hotspots.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHotspots((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] text-regolith hover:border-loro/50 hover:text-white"
          >
            <Eye className="h-3 w-3 text-loro" />
            <span>{showHotspots ? "Hide Pins" : "Show Pins"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-space-900/65 p-3 text-xs leading-relaxed text-regolith/85">
        <p>
          <strong className="font-mono text-sunlit">THEN ({thenNow.thenYear}):</strong>{" "}
          {thenNow.thenCaption}
        </p>
        <p>
          <strong className="font-mono text-loro">NOW (Orbit):</strong>{" "}
          {thenNow.nowCaption}
        </p>
      </div>
    </div>
  );
}
