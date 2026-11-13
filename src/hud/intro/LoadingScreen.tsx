import { useEffect, useState } from "react";
import { preloadNarrationManifest } from "@/audio/speech";
import {
  isHeightLoaded,
  loadLunarHeightGrid,
} from "@/scene/moon/heightSampler";
import { moonTileManager } from "@/scene/moon/tileManager";

const MIN_BOOT_MS = 420;
const MAX_BOOT_MS = 1200;
const FADE_OUT_MS = 320;

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tileStats, setTileStats] = useState(() =>
    moonTileManager.getBootStats(),
  );
  const [demReady, setDemReady] = useState(() => isHeightLoaded());

  useEffect(() => {
    void loadLunarHeightGrid().then((ok) => {
      if (ok) setDemReady(true);
    });
    void moonTileManager.init();
    void preloadNarrationManifest();

    const startTime = performance.now();
    let rafId = 0;
    let unmountTimer = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const stats = moonTileManager.getBootStats();
      const hasDem = isHeightLoaded();

      setTileStats(stats);
      if (hasDem) {
        setDemReady(true);
      }

      const l0Fraction =
        stats.totalTiles > 0 ? stats.l0Loaded / stats.totalTiles : 1;
      const assetProgress = (hasDem ? 0.35 : 0) + l0Fraction * 0.65;
      const timeProgress = Math.min(1, elapsed / MAX_BOOT_MS);
      const minSweep = Math.min(1, elapsed / MIN_BOOT_MS);

      const assetsReady = hasDem && stats.l0Loaded >= stats.totalTiles;
      const nextProgress = assetsReady
        ? minSweep
        : Math.min(0.99, Math.max(timeProgress, assetProgress * minSweep));

      setProgress(nextProgress);

      if ((assetsReady && elapsed >= MIN_BOOT_MS) || elapsed >= MAX_BOOT_MS) {
        setProgress(1);
        setFadingOut(true);
        unmountTimer = window.setTimeout(() => {
          setMounted(false);
        }, FADE_OUT_MS);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (unmountTimer) window.clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  const pct = Math.round(progress * 100);
  const remainingSec = Math.max(
    0,
    ((1 - progress) * MAX_BOOT_MS) / 1000,
  ).toFixed(1);

  const steps = [
    {
      code: "SYS-01",
      label: "LOLA 16-BIT ELEVATION DEM (1440×720)",
      ready: demReady || progress > 0.45,
      detail: demReady ? "LOCKED" : "STREAMING",
    },
    {
      code: "SYS-02",
      label: "LROC WAC ALBEDO & NORMAL TILE MATRIX",
      ready: tileStats.l0Loaded >= tileStats.totalTiles || progress > 0.65,
      detail: `${Math.max(tileStats.l0Loaded, Math.min(tileStats.totalTiles, Math.floor(progress * tileStats.totalTiles)))}/${tileStats.totalTiles} TILES`,
    },
    {
      code: "SYS-03",
      label: "CELESTIAL SPHERE & EARTH 2K SHADERS",
      ready: progress > 0.8,
      detail: progress > 0.8 ? "COMPILED" : "RENDERING",
    },
    {
      code: "SYS-04",
      label: "SURVEYOR 3 TELEMETRY & 3D ARTIFACT MESHES",
      ready: progress >= 0.96,
      detail: progress >= 0.96 ? "ONLINE" : "PRELOADING",
    },
  ];

  return (
    <div
      className={`telemetry-scanlines fixed inset-0 z-50 flex flex-col items-center justify-center bg-space-950 px-6 text-regolith transition-opacity duration-300 ease-out select-none ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading lunar telemetry and rendering 3D globe"
    >
      {/* Subtle radial glow behind telemetry window */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 225, 255, 0.45) 0%, rgba(255, 207, 112, 0.15) 45%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md border border-loro/40 bg-space-950/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-7">
        {/* Corner telemetry brackets */}
        <span className="pointer-events-none absolute -top-px -left-px h-3.5 w-3.5 border-t-2 border-l-2 border-loro" />
        <span className="pointer-events-none absolute -top-px -right-px h-3.5 w-3.5 border-t-2 border-r-2 border-loro" />
        <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2 border-loro" />
        <span className="pointer-events-none absolute -right-px -bottom-px h-3.5 w-3.5 border-r-2 border-b-2 border-loro" />

        {/* Header Eyebrow */}
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-regolith/70 uppercase">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-loro" />
            <span className="text-loro">LRO TELEMETRY DOWNLINK</span>
          </span>
          <span>T-{remainingSec}S</span>
        </div>

        {/* Title */}
        <h2 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-regolith-bright sm:text-3xl">
          Abandoned,{" "}
          <span className="font-normal text-regolith/80 italic">
            Not Forgotten.
          </span>
        </h2>
        <p className="mt-1 font-mono text-[11px] tracking-wider text-regolith/65 uppercase">
          Pre-rendering lunar globe & downloading NASA SVS datasets…
        </p>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="tracking-[0.14em] text-loro uppercase">
              INITIALIZING ORBITAL SCENE
            </span>
            <span className="font-bold text-regolith-bright">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-loro via-regolith-bright to-sunlit transition-[width] duration-75 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Telemetry Subsystem Checklist */}
        <div className="mt-5 space-y-2 border-t border-white/10 pt-4 font-mono text-[10.5px]">
          {steps.map((step) => (
            <div
              key={step.code}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    step.ready ? "bg-sunlit" : "animate-pulse bg-loro/60"
                  }`}
                />
                <span className="text-white/40">{step.code}</span>
                <span
                  className={`truncate ${
                    step.ready ? "text-regolith-bright" : "text-regolith/70"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <span
                className={`shrink-0 tracking-wider ${
                  step.ready ? "text-sunlit" : "text-loro"
                }`}
              >
                {step.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
