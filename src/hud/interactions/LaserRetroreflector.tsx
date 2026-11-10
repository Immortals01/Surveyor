import { useEffect, useRef, useState } from "react";
import { RotateCcw, Zap } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

const SPEED_OF_LIGHT_KM_S = 299_792.458;
const BASE_DISTANCE_1969_KM = 384_400.0;
const DRIFT_CM_PER_YEAR = 3.8;
const ONE_WAY_MS = 1282; // ~1.282 seconds one-way
const ROUND_TRIP_MS = ONE_WAY_MS * 2; // ~2.564 seconds round-trip

export default function LaserRetroreflector() {
  const openSources = useAppStore((s) => s.openSources);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const [year, setYear] = useState(2026);
  const [firing, setFiring] = useState(false);
  const [progress, setProgress] = useState(0); // 0 -> 1 (0..0.5 outbound, 0.5..1 return)
  const [pulseCount, setPulseCount] = useState(0);
  const [photonsCaught, setPhotonsCaught] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const bouncedSoundPlayedRef = useRef(false);

  // Calculate drift since July 1969
  const yearsSince1969 = Math.max(0, year - 1969);
  const driftCm = yearsSince1969 * DRIFT_CM_PER_YEAR;
  const driftMeters = driftCm / 100;
  const driftFeet = driftMeters * 3.28084;

  // Total distance in km with millimeter precision
  const exactDistanceKm = BASE_DISTANCE_1969_KM + driftMeters / 1000;
  const exactRoundTripSec = (exactDistanceKm * 2) / SPEED_OF_LIGHT_KM_S;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const fireLaser = () => {
    if (firing) return;
    audioEngine.playUiTick(1320);

    if (reduceMotion) {
      setProgress(1);
      setPulseCount((c) => c + 1);
      setPhotonsCaught(Math.floor(Math.random() * 4) + 1);
      return;
    }

    setFiring(true);
    setProgress(0);
    setPhotonsCaught(null);
    bouncedSoundPlayedRef.current = false;

    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ROUND_TRIP_MS);
      setProgress(t);

      if (t >= 0.5 && !bouncedSoundPlayedRef.current) {
        bouncedSoundPlayedRef.current = true;
        audioEngine.playUiTick(1760);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setFiring(false);
        setPulseCount((c) => c + 1);
        setPhotonsCaught(Math.floor(Math.random() * 4) + 1);
        audioEngine.playUiTick(1080);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setFiring(false);
    setProgress(0);
    setPhotonsCaught(null);
  };

  // Beam X position in SVG coordinates (Earth = 48, Moon Mirror = 292)
  const earthX = 48;
  const moonX = 292;
  const spanX = moonX - earthX;
  const isOutbound = progress <= 0.5;
  const legProgress = isOutbound ? progress * 2 : (progress - 0.5) * 2;
  const pulseX = isOutbound
    ? earthX + spanX * legProgress
    : moonX - spanX * legProgress;

  const elapsedSec = progress * exactRoundTripSec;

  return (
    <div className="space-y-4 border border-white/15 bg-space-950/90 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[9.5px] font-bold tracking-[0.16em] text-loro uppercase">
            INSTRUMENT 01 // LUNAR LASER RANGING (LLR)
          </span>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight text-regolith-bright">
            Bounce a Laser Off Apollo 11&apos;s Mirror Array
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-1969-059C-04")}
          className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:text-white"
        >
          NSSDCA
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        Apollo 11 left 100 fused-silica corner-cube prisms at Tranquility Base.
        They need <strong>zero batteries</strong>—any light hitting a corner cube
        bounces straight back where it came from.
      </p>

      {/* Interactive SVG Diagram: Earth Observatory <---> Tranquility Base Retroreflector */}
      <div className="border border-white/15 bg-space-900/90 p-3">
        <svg
          viewBox="0 0 340 112"
          className="h-28 w-full select-none"
          role="img"
          aria-label="Earth to Moon laser retroreflector pulse diagram"
        >
          {/* Subtle starfield dots */}
          <circle cx="95" cy="20" r="1" fill="#ffffff" fillOpacity="0.4" />
          <circle cx="155" cy="14" r="1.2" fill="#5ce1ff" fillOpacity="0.5" />
          <circle cx="215" cy="26" r="1" fill="#ffffff" fillOpacity="0.35" />
          <circle cx="135" cy="92" r="1" fill="#ffcf70" fillOpacity="0.4" />
          <circle cx="242" cy="88" r="1.1" fill="#ffffff" fillOpacity="0.35" />

          {/* Dashed reference path */}
          <line
            x1={earthX}
            y1="54"
            x2={moonX}
            y2="54"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Active 532nm Green Laser Trail */}
          {(firing || progress === 1) && (
            <>
              <line
                x1={earthX}
                y1="54"
                x2={isOutbound ? pulseX : moonX}
                y2="54"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeOpacity={isOutbound ? 0.9 : 0.35}
              />
              {!isOutbound && (
                <line
                  x1={moonX}
                  y1="54"
                  x2={pulseX}
                  y2="54"
                  stroke="#5ce1ff"
                  strokeWidth="2.5"
                  strokeDasharray="3 2"
                />
              )}
            </>
          )}

          {/* Moving Photon Packet */}
          {firing && (
            <g transform={`translate(${pulseX}, 54)`}>
              <circle r="7" fill="#4ade80" fillOpacity="0.28" />
              <circle r="3.5" fill="#86efac" />
            </g>
          )}

          {/* Earth & Apache Point Observatory */}
          <g transform="translate(34, 54)">
            <circle r="22" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
            <path
              d="M -10 -12 Q -2 -6 -6 4 Q -12 10 -4 16"
              fill="none"
              stroke="#4ade80"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Observatory dome */}
            <circle cx="14" cy="0" r="4.5" fill="#f8fafc" />
            <text
              x="0"
              y="36"
              textAnchor="middle"
              className="fill-regolith font-mono text-[8.5px]"
            >
              EARTH (APO)
            </text>
          </g>

          {/* Moon & Corner-Cube Retroreflector Array (shifts slightly right with year drift) */}
          <g transform={`translate(${298 + (year - 1969) * 0.08}, 54)`}>
            <circle r="18" fill="#64748b" stroke="#d9cbb0" strokeWidth="1.5" />
            <circle cx="-4" cy="-6" r="3.5" fill="#475569" />
            <circle cx="5" cy="5" r="4.5" fill="#475569" />
            {/* Corner-cube mirror array on Tranquility Base */}
            <polygon
              points="-19,-7 -11,-11 -11,11 -19,7"
              fill={progress >= 0.48 && progress <= 0.65 ? "#4ade80" : "#5ce1ff"}
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              x="-2"
              y="36"
              textAnchor="middle"
              className="fill-sunlit font-mono text-[8.5px]"
            >
              TRANQUILITY
            </text>
          </g>

          {/* Center stopwatch & status readout */}
          <text
            x="170"
            y="36"
            textAnchor="middle"
            className="fill-loro font-mono text-[10px] font-bold"
          >
            {firing
              ? isOutbound
                ? `OUTBOUND · ${elapsedSec.toFixed(2)}s`
                : `RETURNING · ${elapsedSec.toFixed(2)}s`
              : progress === 1
                ? `ROUND TRIP · ${exactRoundTripSec.toFixed(4)}s`
                : "532 nm GREEN LASER READY"}
          </text>
          <text
            x="170"
            y="74"
            textAnchor="middle"
            className="fill-regolith/80 font-mono text-[9px]"
          >
            c = 299,792.458 km/s · 1.28 s each way
          </text>
        </svg>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={fireLaser}
            disabled={firing}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border border-regolith-bright bg-regolith-bright px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider text-space-950 uppercase transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>
              {firing
                ? "Pulse in Flight (2.56s)..."
                : "Fire Earth Laser Pulse"}
            </span>
          </button>

          {progress > 0 && !firing && (
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer border border-white/15 bg-white/5 p-2.5 text-regolith transition hover:border-loro hover:text-white"
              aria-label="Reset laser experiment"
              title="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Live Telemetry Readout Ledger */}
      <div className="grid grid-cols-2 border-t border-l border-white/15 bg-space-950">
        <div className="border-r border-b border-white/15 p-3">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
            01 MEASURED RANGE ({year})
          </span>
          <p className="mt-1 font-mono text-xs font-bold text-sunlit">
            {exactDistanceKm.toLocaleString("en-US", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}{" "}
            km
          </p>
        </div>

        <div className="border-r border-b border-white/15 p-3">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
            02 RETURN PHOTONS
          </span>
          <p className="mt-1 font-mono text-xs font-bold text-loro">
            {photonsCaught !== null
              ? `${photonsCaught} / 10¹⁷ (${pulseCount} runs)`
              : "AWAITING PULSE"}
          </p>
        </div>
      </div>

      {/* Time-Travel Drift Slider (1969 -> 2050) */}
      <div className="border border-white/15 bg-space-900/60 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="lunar-drift-year"
            className="font-mono text-[10px] font-bold tracking-[0.14em] text-sunlit uppercase"
          >
            ORBITAL RECESSION · YEAR {year}
          </label>
          <span className="font-mono text-[10.5px] font-bold text-regolith-bright">
            +{driftMeters.toFixed(2)} m (+{driftFeet.toFixed(1)} ft) since 1969
          </span>
        </div>

        <input
          id="lunar-drift-year"
          type="range"
          min={1969}
          max={2050}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mt-2.5 h-1 w-full cursor-pointer accent-sunlit"
          aria-label="Slide year from 1969 to 2050 to see the Moon drift away at 3.8 centimeters per year"
        />

        <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-regolith/55">
          <span>1969 (APOLLO 11)</span>
          <span>2026 (+2.17 m)</span>
          <span>2050 (+3.08 m)</span>
        </div>

        <p className="mt-2.5 border-t border-white/10 pt-2.5 text-xs leading-relaxed text-regolith/85">
          <strong>Discovery:</strong> Because of Apollo&apos;s mirrors, we know
          Earth&apos;s ocean tides push the Moon away at{" "}
          <span className="font-mono text-sunlit">3.8 cm/year</span>—about as
          fast as human fingernails grow.
        </p>
      </div>
    </div>
  );
}
