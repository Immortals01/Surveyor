import { useEffect, useRef, useState } from "react";
import { Flame, Rocket, Sun } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

type QuakePresetId = "meteoroid" | "thermal" | "sivb";

interface QuakePreset {
  id: QuakePresetId;
  label: string;
  energyNote: string;
  lunarRingNote: string;
  earthDecay: number;
  moonDecay: number;
  freqHz: number;
  amplitude: number;
}

const PRESETS: Record<QuakePresetId, QuakePreset> = {
  meteoroid: {
    id: "meteoroid",
    label: "Meteoroid Hit",
    energyNote: "Golf-ball rock striking at 70,000 km/h",
    lunarRingNote: "Lunar crust rings for ~28 minutes",
    earthDecay: 3.4,
    moonDecay: 0.24,
    freqHz: 21,
    amplitude: 0.85,
  },
  thermal: {
    id: "thermal",
    label: "Sunrise Thermal Quake",
    energyNote: "Frozen −170°C rocks snapping as sunlight hits",
    lunarRingNote: "Crackling micro-tremors for ~18 minutes",
    earthDecay: 4.5,
    moonDecay: 0.35,
    freqHz: 29,
    amplitude: 0.62,
  },
  sivb: {
    id: "sivb",
    label: "Saturn V S-IVB Crash",
    energyNote: "14,000 kg booster stage deliberately crashed into the Moon",
    lunarRingNote: "Moon 'rang like a bell' for over 3 hours!",
    earthDecay: 2.6,
    moonDecay: 0.14,
    freqHz: 15,
    amplitude: 1.0,
  },
};

export default function Moonquake() {
  const openSources = useAppStore((s) => s.openSources);
  const [activePreset, setActivePreset] = useState<QuakePresetId>("sivb");
  const [triggerTime, setTriggerTime] = useState<number>(() => performance.now());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preset = PRESETS[activePreset];

  const handleTrigger = (id: QuakePresetId) => {
    setActivePreset(id);
    setTriggerTime(performance.now());
    audioEngine.playUiTick(id === "sivb" ? 420 : id === "meteoroid" ? 640 : 880);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const render = (now: number) => {
      const elapsedSec = Math.max(0, (now - triggerTime) / 1000);
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.27);
      ctx.lineTo(w, h * 0.27);
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(w, h * 0.75);
      ctx.stroke();

      // Top trace: EARTH CRUST (damps rapidly because water & soil absorb energy)
      ctx.strokeStyle = "#5ce1ff";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = elapsedSec - (w - x) * 0.015;
        let yOff = 0;
        if (t > 0) {
          const env = Math.exp(-t * preset.earthDecay) * Math.min(1, t * 14);
          yOff =
            Math.sin(t * preset.freqHz) *
            Math.cos(t * 7.3) *
            env *
            preset.amplitude *
            22;
        }
        const py = h * 0.27 + yOff;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Bottom trace: LUNAR CRUST (dry, fractured breccia scatters waves for hours!)
      ctx.strokeStyle = "#ffcf70";
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = elapsedSec - (w - x) * 0.015;
        let yOff = 0;
        if (t > 0) {
          const env = Math.exp(-t * preset.moonDecay) * Math.min(1, t * 9);
          yOff =
            (Math.sin(t * preset.freqHz * 1.1) * 0.65 +
              Math.sin(t * preset.freqHz * 0.63 + 1.2) * 0.35) *
            env *
            preset.amplitude *
            26;
        }
        const py = h * 0.75 + yOff;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [preset, triggerTime]);

  return (
    <div className="space-y-4 border border-white/15 bg-space-950/90 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[9.5px] font-bold tracking-[0.16em] text-sunlit uppercase">
            INSTRUMENT 02 // ALSEP SEISMIC NETWORK (1969–1977)
          </span>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight text-regolith-bright">
            Why Does the Moon &ldquo;Ring Like a Bell&rdquo;?
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NAKAMURA-1981")}
          className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:text-white"
        >
          REF
        </button>
      </div>

      {/* Trigger Buttons */}
      <div className="grid grid-cols-3 border-t border-l border-white/15 bg-space-950">
        <button
          type="button"
          onClick={() => handleTrigger("meteoroid")}
          className={`flex cursor-pointer flex-col items-center gap-1 border-r border-b border-white/15 p-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
            activePreset === "meteoroid"
              ? "bg-regolith-bright font-bold text-space-950"
              : "bg-space-900/50 text-regolith/75 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Meteoroid</span>
        </button>

        <button
          type="button"
          onClick={() => handleTrigger("thermal")}
          className={`flex cursor-pointer flex-col items-center gap-1 border-r border-b border-white/15 p-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
            activePreset === "thermal"
              ? "bg-regolith-bright font-bold text-space-950"
              : "bg-space-900/50 text-regolith/75 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Thermal</span>
        </button>

        <button
          type="button"
          onClick={() => handleTrigger("sivb")}
          className={`flex cursor-pointer flex-col items-center gap-1 border-r border-b border-white/15 p-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
            activePreset === "sivb"
              ? "bg-regolith-bright font-bold text-space-950"
              : "bg-space-900/50 text-regolith/75 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Rocket className="h-3.5 w-3.5" />
          <span>S-IVB Crash</span>
        </button>
      </div>

      {/* Dual Seismogram Canvas */}
      <div className="relative overflow-hidden border border-white/15 bg-space-900/90 p-3">
        <div className="pointer-events-none flex justify-between font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-loro">
            CH 1 · EARTH CRUST (WATER DAMPS IN ~30S)
          </span>
          <span className="text-regolith/50">LIVE SEISMOGRAM</span>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={128}
          className="my-1.5 h-32 w-full"
          aria-label="Comparison seismogram showing Earth waves damping fast while Moon waves keep ringing"
        />

        <div className="pointer-events-none flex justify-between font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-sunlit">
            CH 2 · MOON CRUST (DRY FRACTURED BRECCIA)
          </span>
          <span className="text-sunlit/80">{preset.lunarRingNote}</span>
        </div>
      </div>

      <div className="border border-white/15 bg-space-900/50 p-3.5 text-xs leading-relaxed text-regolith/90">
        <p>
          <strong className="font-mono tracking-wider text-sunlit uppercase">
            {preset.label}:
          </strong>{" "}
          {preset.energyNote}. Over 8 years, Apollo&apos;s left-behind
          seismometers logged <strong>12,558 moonquakes</strong> and revealed the
          Moon&apos;s 500 km iron core.
        </p>
      </div>
    </div>
  );
}
