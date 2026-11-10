import { useState } from "react";
import { Flame, HeartPulse, Rocket } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

export default function MoxieOxygenGenerator() {
  const openSources = useAppStore((s) => s.openSources);
  const [tempC, setTempC] = useState(800);
  const [runsCompleted, setRunsCompleted] = useState(16);

  // Solid Oxide Electrolysis requires ~800°C to split 2 CO2 -> 2 CO + O2
  const tempEfficiency =
    tempC < 650
      ? 0
      : Math.min(1, 1 - Math.abs(tempC - 800) / 280);

  const gramsPerHour = +(tempEfficiency * 9.8).toFixed(1);
  const totalGramsO2 = Math.round(runsCompleted * 7.625 * (0.4 + 0.6 * tempEfficiency));
  // An active astronaut breathes ~0.55 g O2 per minute (~33 g/hr)
  const dogBreathingMinutes = Math.round((totalGramsO2 / 0.3) * 1);
  const astronautMinutes = Math.round(totalGramsO2 / 0.55);

  return (
    <div className="space-y-4 border border-white/15 bg-space-950/90 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[9.5px] font-bold tracking-[0.16em] text-loro uppercase">
            INSTRUMENT 03 // ISRU CHEMISTRY LAB · PERSEVERANCE MOXIE
          </span>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight text-regolith-bright">
            Brew Breathable Oxygen Out of Martian CO₂ Air
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-2020-052A")}
          className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:text-white"
        >
          REF
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        Mars&apos;s air is <strong>96% carbon dioxide (CO₂)</strong>. Inside
        Perseverance&apos;s belly, a gold-plated reactor called{" "}
        <strong>MOXIE</strong> heats ceramic fuel cells to{" "}
        <span className="font-mono text-sunlit">800°C</span> to electrochemically
        split oxygen atoms off CO₂ molecules:{" "}
        <code className="font-mono text-loro">2CO₂ → 2CO + O₂</code>.
      </p>

      {/* Gold-Plated MOXIE Reactor Control Block */}
      <div className="border border-white/15 bg-space-900/80 p-3.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-sunlit">INTAKE: 96% CO₂ MARTIAN AIR</span>
          <span className="text-loro">
            OUTPUT: {gramsPerHour} g/hr O₂ (98%+ PURITY)
          </span>
        </div>

        {/* Temperature & Run Sliders */}
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="moxie-temp-slider"
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-[0.12em] text-sunlit uppercase"
              >
                <Flame className="h-3 w-3 text-orange-400" />
                <span>SOXE STACK TEMP: {tempC}°C</span>
              </label>
              <span className="font-mono text-[10px] font-bold text-loro uppercase">
                {tempC >= 760 && tempC <= 830
                  ? "OPTIMAL 800°C ELECTROLYSIS"
                  : tempC < 650
                    ? "BELOW ACTIVATION THRESHOLD"
                    : `${Math.round(tempEfficiency * 100)}% YIELD`}
              </span>
            </div>
            <input
              id="moxie-temp-slider"
              type="range"
              min={500}
              max={900}
              step={10}
              value={tempC}
              onChange={(e) => {
                setTempC(Number(e.target.value));
                audioEngine.playUiTick();
              }}
              className="mt-2 h-1 w-full cursor-pointer accent-sunlit"
              aria-label="Adjust MOXIE solid oxide electrolysis temperature in degrees Celsius"
            />
          </div>

          <div className="border-t border-white/10 pt-2.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="moxie-runs-slider"
                className="font-mono text-[10px] font-bold tracking-[0.12em] text-loro uppercase"
              >
                EXPERIMENTAL RUNS: {runsCompleted} / 16
              </label>
              <span className="font-mono text-[10px] font-bold text-regolith-bright uppercase">
                {totalGramsO2} g CUMULATIVE O₂
              </span>
            </div>
            <input
              id="moxie-runs-slider"
              type="range"
              min={1}
              max={16}
              step={1}
              value={runsCompleted}
              onChange={(e) => {
                setRunsCompleted(Number(e.target.value));
                audioEngine.playUiTick();
              }}
              className="mt-2 h-1 w-full cursor-pointer accent-loro"
              aria-label="Adjust number of MOXIE experimental oxygen production runs"
            />
          </div>
        </div>
      </div>

      {/* Output Comparison Ledger */}
      <div className="grid grid-cols-2 border-t border-l border-white/15 bg-space-950">
        <div className="border-r border-b border-white/15 p-3">
          <div className="flex items-center gap-1 font-mono text-[9.5px] tracking-[0.14em] text-loro uppercase">
            <HeartPulse className="h-3 w-3" />
            <span>01 METABOLIC YIELD</span>
          </div>
          <p className="mt-1.5 font-display text-xs font-bold text-regolith-bright">
            {astronautMinutes} min for 1 Astronaut
          </p>
          <p className="mt-0.5 font-mono text-[9.5px] text-regolith/60">
            ({dogBreathingMinutes} min for a small dog)
          </p>
        </div>

        <div className="border-r border-b border-white/15 p-3">
          <div className="flex items-center gap-1 font-mono text-[9.5px] tracking-[0.14em] text-sunlit uppercase">
            <Rocket className="h-3 w-3" />
            <span>02 ASCENT OXIDIZER</span>
          </div>
          <p className="mt-1.5 font-display text-xs font-bold text-regolith-bright">
            ~25–30 Tons Required
          </p>
          <p className="mt-0.5 font-mono text-[9.5px] text-regolith/60">
            78% of propellant mass is LOX
          </p>
        </div>
      </div>
    </div>
  );
}
