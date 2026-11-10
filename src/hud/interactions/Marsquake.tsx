import { useEffect, useRef, useState } from "react";
import { Activity, Flame, Layers, Sparkles } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

type MarsQuakePresetId = "s1222a" | "cerberus" | "meteoroid";

interface MarsQuakePreset {
  id: MarsQuakePresetId;
  label: string;
  eventCode: string;
  energyNote: string;
  coreNote: string;
  earthDecay: number;
  marsDecay: number;
  freqHz: number;
  amplitude: number;
}

const PRESETS: Record<MarsQuakePresetId, MarsQuakePreset> = {
  s1222a: {
    id: "s1222a",
    label: "Monster Quake (M4.7)",
    eventCode: "S1222a · May 4, 2022",
    energyNote: "Largest marsquake ever recorded—reverberated around Mars for 6 hours!",
    coreNote: "Surface waves circled Mars multiple times",
    earthDecay: 3.1,
    marsDecay: 0.42,
    freqHz: 17,
    amplitude: 1.0,
  },
  cerberus: {
    id: "cerberus",
    label: "Cerberus Fossae Fault",
    eventCode: "S0173a · May 2019",
    energyNote: "Tectonic graben cracking above warm volcanic plumes 1,600 km east",
    coreNote: "Core-reflected ScS waves pinpointed 1,830 km liquid core",
    earthDecay: 3.8,
    marsDecay: 0.58,
    freqHz: 23,
    amplitude: 0.78,
  },
  meteoroid: {
    id: "meteoroid",
    label: "Ice-Excavating Impact",
    eventCode: "S1094b · Dec 24, 2021",
    energyNote: "Meteoroid gouged a 150-meter crater & threw boulders of buried water ice!",
    coreNote: "Confirmed by MRO Context Camera within 24 hours",
    earthDecay: 3.5,
    marsDecay: 0.48,
    freqHz: 26,
    amplitude: 0.9,
  },
};

export default function Marsquake() {
  const openSources = useAppStore((s) => s.openSources);
  const [activePreset, setActivePreset] = useState<MarsQuakePresetId>("s1222a");
  const [triggerTime, setTriggerTime] = useState<number>(() => performance.now());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preset = PRESETS[activePreset];

  const handleTrigger = (id: MarsQuakePresetId) => {
    setActivePreset(id);
    setTriggerTime(performance.now());
    audioEngine.playUiTick(id === "s1222a" ? 380 : 540);
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

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.28);
      ctx.lineTo(w, h * 0.28);
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(w, h * 0.75);
      ctx.stroke();

      // Top trace: Primary P/S Crustal Arrival
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
            Math.cos(t * 6.5) *
            env *
            preset.amplitude *
            22;
        }
        const py = h * 0.28 + yOff;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Bottom trace: InSight SEIS Martian Mantle & Liquid Core Echoes (ScS)
      ctx.strokeStyle = "#ff9f5c";
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = elapsedSec - (w - x) * 0.015;
        let yOff = 0;
        if (t > 0) {
          const env = Math.exp(-t * preset.marsDecay) * Math.min(1, t * 10);
          // Secondary core-reflection packet around t = 1.2s
          const coreEcho = Math.exp(-Math.pow(t - 1.25, 2) * 5.0) * 0.85;
          yOff =
            (Math.sin(t * preset.freqHz * 0.95) * (0.6 + coreEcho) +
              Math.sin(t * preset.freqHz * 0.58 + 1.1) * 0.4) *
            env *
            preset.amplitude *
            25;
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
    <div className="space-y-3.5 rounded-2xl border border-loro/35 bg-space-950/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-orange-300 uppercase">
            <Activity className="h-3 w-3" />
            InSight SEIS Seismometer · 1,319 Marsquakes
          </span>
          <h3 className="mt-0.5 font-display text-base font-bold text-regolith-bright">
            X-Raying Mars&apos;s Molten Core With Marsquakes
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-2018-042A")}
          className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro hover:border-loro"
        >
          Cite
        </button>
      </div>

      {/* Trigger Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => handleTrigger("s1222a")}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-mono text-[10.5px] transition ${
            activePreset === "s1222a"
              ? "border-sunlit bg-sunlit/20 font-bold text-sunlit"
              : "border-white/10 bg-space-900/80 text-regolith hover:border-white/30"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>M4.7 Record</span>
        </button>

        <button
          type="button"
          onClick={() => handleTrigger("cerberus")}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-mono text-[10.5px] transition ${
            activePreset === "cerberus"
              ? "border-sunlit bg-sunlit/20 font-bold text-sunlit"
              : "border-white/10 bg-space-900/80 text-regolith hover:border-white/30"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Cerberus Fault</span>
        </button>

        <button
          type="button"
          onClick={() => handleTrigger("meteoroid")}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center font-mono text-[10.5px] transition ${
            activePreset === "meteoroid"
              ? "border-sunlit bg-sunlit/20 font-bold text-sunlit"
              : "border-white/10 bg-space-900/80 text-regolith hover:border-white/30"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Ice Impactor</span>
        </button>
      </div>

      {/* Seismogram Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-space-900/95 p-2.5">
        <div className="pointer-events-none flex justify-between font-mono text-[10px]">
          <span className="text-loro">
            CRUSTAL P-WAVE ARRIVAL ({preset.eventCode})
          </span>
          <span className="text-regolith/50">SEIS VBB DOME</span>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={128}
          className="my-1 h-32 w-full"
          aria-label="InSight SEIS Marsquake seismogram showing crustal and liquid-core reflected waves"
        />

        <div className="pointer-events-none flex justify-between font-mono text-[10px]">
          <span className="text-orange-300">
            MANTLE & LIQUID CORE ECHO (ScS)
          </span>
          <span className="text-sunlit/80">{preset.coreNote}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-space-900/70 p-3 text-xs leading-relaxed text-regolith/85">
        <p>
          <strong className="font-mono text-sunlit">{preset.label}:</strong>{" "}
          {preset.energyNote}
        </p>
      </div>
    </div>
  );
}
