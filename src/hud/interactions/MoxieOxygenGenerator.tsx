import { useState } from "react";
import { Flame, HeartPulse, Rocket, Sparkles } from "lucide-react";
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
    <div className="space-y-3.5 rounded-2xl border border-loro/35 bg-space-950/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-emerald-400 uppercase">
            <Sparkles className="h-3 w-3" />
            ISRU Chemistry Lab · Perseverance MOXIE
          </span>
          <h3 className="mt-0.5 font-display text-base font-bold text-regolith-bright">
            Brew Breathable Oxygen Out of Martian CO₂ Air!
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-2020-052A")}
          className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro hover:border-loro"
        >
          Cite
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        Mars&apos;s air is <strong>96% carbon dioxide (CO₂)</strong>. Inside
        Perseverance&apos;s belly, a gold-plated toaster-sized box called{" "}
        <strong>MOXIE</strong> heats ceramic fuel cells to{" "}
        <span className="font-mono text-sunlit">800°C</span> to electrochemically
        snap oxygen atoms off CO₂ molecules: <code className="text-emerald-300">2CO₂ → 2CO + O₂</code>!
      </p>

      {/* Gold-Plated MOXIE Reactor Diagram */}
      <div className="rounded-xl border border-sunlit/35 bg-space-900/95 p-3">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-amber-300">IN: 96% CO₂ MARTIAN AIR</span>
          <span className="text-emerald-300">
            OUT: {gramsPerHour} g/hr PURE O₂ (98%+ PURITY)
          </span>
        </div>

        {/* Temperature & Run Sliders */}
        <div className="mt-3 space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="moxie-temp-slider"
                className="inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold text-sunlit uppercase"
              >
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>SOXE Ceramic Stack Temp: {tempC}°C</span>
              </label>
              <span className="font-mono text-[10.5px] font-bold text-emerald-300">
                {tempC >= 760 && tempC <= 830
                  ? "★ Optimal 800°C Electrolysis"
                  : tempC < 650
                    ? "Too Cold to Split CO₂"
                    : `${Math.round(tempEfficiency * 100)}% Yield`}
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
              className="mt-1.5 h-1.5 w-full cursor-pointer accent-sunlit"
              aria-label="Adjust MOXIE solid oxide electrolysis temperature in degrees Celsius"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="moxie-runs-slider"
                className="font-mono text-[10.5px] font-semibold text-loro uppercase"
              >
                Experimental Runs Completed: {runsCompleted} / 16
              </label>
              <span className="font-mono text-[10.5px] font-bold text-regolith-bright">
                {totalGramsO2} g Total O₂ Produced
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
              className="mt-1.5 h-1.5 w-full cursor-pointer accent-loro"
              aria-label="Adjust number of MOXIE experimental oxygen production runs"
            />
          </div>
        </div>
      </div>

      {/* Output Comparison Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/10 bg-space-900/80 p-2.5">
          <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-300 uppercase">
            <HeartPulse className="h-3 w-3" />
            <span>Breathable Air Yield</span>
          </div>
          <p className="mt-1 font-display text-xs font-bold text-regolith-bright">
            {astronautMinutes} min for 1 Astronaut
          </p>
          <p className="font-mono text-[10px] text-regolith/65">
            ({dogBreathingMinutes} min for a small dog!)
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-space-900/80 p-2.5">
          <div className="flex items-center gap-1 font-mono text-[10px] text-sunlit uppercase">
            <Rocket className="h-3 w-3" />
            <span>Why Astronauts Need O₂</span>
          </div>
          <p className="mt-1 font-display text-xs font-bold text-regolith-bright">
            ~25–30 Tons for Liftoff!
          </p>
          <p className="font-mono text-[10px] text-regolith/65">
            78% of rocket fuel mass is liquid O₂
          </p>
        </div>
      </div>
    </div>
  );
}
