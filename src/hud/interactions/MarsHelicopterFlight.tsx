import { useEffect, useRef, useState } from "react";
import { Fan, Play, RotateCcw, Wind } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

const HOVER_RPM_THRESHOLD = 2400;
const NOMINAL_MARS_RPM = 2537;

export default function MarsHelicopterFlight() {
  const openSources = useAppStore((s) => s.openSources);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const [rpm, setRpm] = useState(2537);
  const [flying, setFlying] = useState(false);
  const [altitudeM, setAltitudeM] = useState(0);
  const [flightCount, setFlightCount] = useState(72);
  const [bladeAngle, setBladeAngle] = useState(0);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Thrust-to-weight ratio on Mars (g = 3.72 m/s², air density ~0.017 kg/m³)
  const liftRatio = Math.pow(rpm / HOVER_RPM_THRESHOLD, 2);
  const canHover = rpm >= HOVER_RPM_THRESHOLD;
  const targetPeakAlt = canHover
    ? Math.min(12.0, 3.0 + ((rpm - HOVER_RPM_THRESHOLD) / 400) * 9.0)
    : 0;

  const launchHop = () => {
    if (flying) return;
    audioEngine.playUiTick(canHover ? 880 : 320);

    if (!canHover) {
      setAltitudeM(0);
      return;
    }

    if (reduceMotion) {
      setAltitudeM(targetPeakAlt);
      setFlightCount((c) => c + 1);
      return;
    }

    setFlying(true);
    const start = performance.now();
    const durationMs = 2800;

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // Smooth climb -> hover -> touchdown curve
      const arch = Math.sin(t * Math.PI);
      const plateau = Math.min(1, arch * 1.35);
      setAltitudeM(targetPeakAlt * plateau);
      setBladeAngle((a) => (a + rpm * 0.018) % 360);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setFlying(false);
        setAltitudeM(targetPeakAlt);
        setFlightCount((c) => c + 1);
        audioEngine.playUiTick(1040);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setFlying(false);
    setAltitudeM(0);
  };

  // Helicopter Y coordinate in SVG (ground = 88, top = 26)
  const heliY = 88 - (altitudeM / 12) * 56;

  return (
    <div className="space-y-3.5 rounded-2xl border border-loro/35 bg-space-950/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-amber-300 uppercase">
            <Wind className="h-3 w-3" />
            Aerodynamics Lab · 1% Earth Atmosphere
          </span>
          <h3 className="mt-0.5 font-display text-base font-bold text-regolith-bright">
            Spin Ingenuity&apos;s Coaxial Rotors in Thin Martian Air
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-2020-052B")}
          className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro hover:border-loro"
        >
          Cite
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        Mars&apos;s atmosphere is <strong>99% thinner</strong> than Earth&apos;s—equivalent
        to flying 30 km (100,000 ft) above Earth! While an Earth helicopter spins
        at ~500 RPM, 1.8-kg Ingenuity must spin its 1.2-meter carbon-fiber blades
        past <strong>2,400 RPM</strong> just to lift off!
      </p>

      {/* Interactive Flight Telemetry SVG */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#140b08] p-3">
        <svg
          viewBox="0 0 340 116"
          className="h-28 w-full select-none"
          role="img"
          aria-label="Ingenuity Mars Helicopter rotor lift simulator in Jezero Crater"
        >
          {/* Amber Martian sky gradient & Jezero delta cliffs */}
          <polygon
            points="0,96 58,64 132,82 218,56 290,76 340,68 340,116 0,116"
            fill="#3b1d12"
          />
          <rect x="0" y="94" width="340" height="24" fill="#6b3420" />

          {/* Wright Brothers Field / Valinor Hills Landing Zone */}
          <ellipse cx="170" cy="98" rx="44" ry="5" fill="#9a4b2c" />

          {/* Shadow on Martian sand (shrinks as altitude increases) */}
          <ellipse
            cx="170"
            cy="98"
            rx={Math.max(6, 18 - altitudeM * 0.8)}
            ry="3"
            fill="#090402"
            fillOpacity={Math.max(0.2, 0.65 - altitudeM * 0.03)}
          />

          {/* Downwash dust plumes when spinning near ground */}
          {(flying || altitudeM > 0) && (
            <g opacity="0.55">
              <circle
                cx={142 - (bladeAngle % 18)}
                cy="95"
                r="3"
                fill="#e09f70"
              />
              <circle
                cx={198 + (bladeAngle % 18)}
                cy="95"
                r="3"
                fill="#e09f70"
              />
            </g>
          )}

          {/* Ingenuity Helicopter Body */}
          <g transform={`translate(170, ${heliY})`}>
            {/* 4 spindly landing legs */}
            <line x1="-8" y1="2" x2="-18" y2="10" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="8" y1="2" x2="18" y2="10" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Gold Kapton fuselage cube */}
            <rect
              x="-8"
              y="-6"
              width="16"
              height="10"
              rx="1.5"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="1"
            />
            {/* Coaxial mast */}
            <line x1="0" y1="-6" x2="0" y2="-18" stroke="#94a3b8" strokeWidth="2" />
            {/* Counter-rotating Rotor #1 & #2 */}
            <ellipse
              cx="0"
              cy="-11"
              rx={flying || altitudeM > 0 ? 32 : 28}
              ry="2.2"
              fill="#5ce1ff"
              fillOpacity={flying ? 0.75 : 0.9}
            />
            <ellipse
              cx="0"
              cy="-15"
              rx={flying || altitudeM > 0 ? 32 : 28}
              ry="2.2"
              fill="#ffcf70"
              fillOpacity={flying ? 0.75 : 0.9}
            />
            {/* Top solar panel */}
            <rect x="-10" y="-19" width="20" height="2.5" fill="#38bdf8" />
          </g>

          {/* Telemetry Readouts */}
          <text
            x="12"
            y="20"
            className="fill-amber-300 font-mono text-[9.5px] font-bold"
          >
            ROTOR: {rpm} RPM
          </text>
          <text
            x="12"
            y="34"
            className="fill-regolith/80 font-mono text-[8.5px]"
          >
            LIFT/WEIGHT: {(liftRatio * 100).toFixed(0)}%
          </text>

          <text
            x="328"
            y="20"
            textAnchor="end"
            className="fill-loro font-mono text-[9.5px] font-bold"
          >
            ALTITUDE: {altitudeM.toFixed(1)} m
          </text>
          <text
            x="328"
            y="34"
            textAnchor="end"
            className="fill-regolith/80 font-mono text-[8.5px]"
          >
            FLIGHT LOG #{flightCount}
          </text>
        </svg>

        {/* RPM Slider */}
        <div className="mt-2 rounded-lg border border-white/10 bg-space-950/80 p-2.5">
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="ingenuity-rpm-slider"
              className="font-mono text-[10.5px] font-semibold text-sunlit uppercase"
            >
              Blade Speed: {rpm} RPM{" "}
              {rpm === NOMINAL_MARS_RPM ? "(Nominal Mars Cruise)" : ""}
            </label>
            <span
              className={`font-mono text-[10.5px] font-bold ${
                canHover ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {canHover ? "✓ Lift Exceeds Mars Gravity" : "✗ Too Slow for 0.01 bar Air"}
            </span>
          </div>
          <input
            id="ingenuity-rpm-slider"
            type="range"
            min={500}
            max={2800}
            step={25}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="mt-1.5 h-1.5 w-full cursor-pointer accent-sunlit"
            aria-label="Adjust Ingenuity rotor blade RPM from 500 Earth RPM to 2800 Mars RPM"
          />
          <div className="mt-1 flex justify-between font-mono text-[9.5px] text-regolith/60">
            <span>500 RPM (Earth Heli)</span>
            <span>2,400 RPM (Liftoff)</span>
            <span>2,800 RPM (Mach 0.7 Tip)</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={launchHop}
            disabled={flying}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs font-bold transition ${
              canHover
                ? "bg-sunlit text-space-950 shadow-[0_0_20px_rgba(255,207,112,0.35)] hover:brightness-110"
                : "border border-rose-400/40 bg-rose-950/50 text-rose-200"
            }`}
          >
            {canHover ? (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {flying
                    ? "Hovering Above Jezero Dunes..."
                    : `Spin Up & Fly (${targetPeakAlt.toFixed(1)}m Peak)`}
                </span>
              </>
            ) : (
              <>
                <Fan className="h-4 w-4" />
                <span>Increase RPM Past 2,400 to Lift Off!</span>
              </>
            )}
          </button>

          {altitudeM > 0 && !flying && (
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer rounded-xl border border-white/15 bg-white/5 p-2.5 text-regolith hover:border-loro hover:text-white"
              aria-label="Land Ingenuity"
              title="Land"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
