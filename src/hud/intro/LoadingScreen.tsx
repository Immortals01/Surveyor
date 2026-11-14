import { useEffect, useState } from "react";
import { preloadNarrationManifest } from "@/audio/speech";
import { isHeightLoaded, loadLunarHeightGrid } from "@/scene/moon/heightSampler";
import { marsTileManager, moonTileManager } from "@/scene/moon/tileManager";

const MIN_BOOT_MS = 420;
const MAX_BOOT_MS = 1200;
const FADE_OUT_MS = 320;
const MARS_WARMUP_DELAY_MS = 1500;

/**
 * After boot settles, stream Mars L0/L1 tiles and the MOLA grid at background
 * priority so the first switch to Mars never reveals untextured, undisplaced
 * terrain. Only evictable L2/L3 content is skipped here; it loads on demand.
 */
function warmMarsAssets(): void {
  window.setTimeout(() => {
    void marsTileManager.init();
    void loadMarsGrid();
  }, MARS_WARMUP_DELAY_MS);
}

async function loadMarsGrid(): Promise<void> {
  const { loadPlanetaryHeightGrid } = await import("@/scene/moon/heightSampler");
  await loadPlanetaryHeightGrid("mars");
}

/**
 * Boot screen: a bare progress bar on the deep-space background. It tracks real
 * work (LOLA elevation grid + L0 color tiles) and never outlives MAX_BOOT_MS.
 */
export default function LoadingScreen() {
  const [mounted, setMounted] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    void loadLunarHeightGrid();
    void moonTileManager.init();
    void preloadNarrationManifest();

    const startTime = performance.now();
    let rafId = 0;
    let unmountTimer = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const stats = moonTileManager.getBootStats();
      const hasDem = isHeightLoaded();

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
        warmMarsAssets();
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-space-950 px-8 transition-opacity duration-300 ease-out select-none sm:px-14 ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading the lunar globe"
    >
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-baseline justify-between font-mono text-[10.5px] tracking-[0.16em] uppercase">
          <span className="text-regolith/70">Loading the lunar archive</span>
          <span className="font-bold text-regolith-bright">{pct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-sunlit transition-[width] duration-75 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
