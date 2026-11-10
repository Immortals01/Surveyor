import { useEffect, useRef, useState } from "react";
import { Flame, Layers, Sparkles } from "lucide-react";
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
    energyNote: "Largest marsquake ever recorded—reverberated around Mars for 6 hours.",
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
    energyNote: "Tectonic graben cracking above warm volcanic plumes 1,600 km east.",
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
    energyNote: "Meteoroid gouged a 150-meter crater and threw boulders of buried water ice.",
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
      let maxAbsY = 0;
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
          const absY = Math.abs(yOff);
          if (absY > maxAbsY) maxAbsY = absY;
        }
        const py = h * 0.75 + yOff;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // Stop 60 FPS redraw loop once the entire visible trace has decayed to a flat line
      const minWindowT = elapsedSec - w * 0.015;
      if (minWindowT < 2.0 || maxAbsY > 0.08) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [preset, triggerTime]);

  return (
    <div className="space-y-4 border border-white/15 bg-space-950/90 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[9.5px] font-bold tracking-[0.16em] text-sunlit uppercase">
            INSTRUMENT 02 // INSIGHT SEIS SEISMOMETER · 1,319 MARSQUAKES
          </span>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight text-regolith-bright">
            X-Raying Mars&apos;s Molten Core With Marsquakes
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-2018-042A")}
          className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:text-white"
        >
          REF
        </button>
      </div>

      {/* Trigger Buttons */}
      <div className="grid grid-cols-3 border-t border-l border-white/15 bg-space-950">
        <button
          type="button"
          onClick={() => handleTrigger("s1222a")}
          className={`flex cursor-pointer flex-col items-center gap-1 border-r border-b border-white/15 p-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
            activePreset === "s1222a"
              ? "bg-regolith-bright font-bold text-space-950"
              : "bg-space-900/50 text-regolith/75 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>M4.7 Record</span>
        </button>

        <button
          type="button"
          onClick={() => handleTrigger("cerberus")}
          className={`flex cursor-pointer flex-col items-center gap-1 border-r border-b border-white/15 p-2.5 text-center font-mono text-[10px] tracking-wider uppercase transition ${
            activePreset === "cerberus"
              ? "bg-regolith-bright font-bold text-space-950"
              : "bg-space-900/50 text-regolith/75 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Cerberus</span>
        </button>

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
          <span>Ice Impact</span>
        </button>
      </div>

      {/* Seismogram Canvas */}
      <div className="relative overflow-hidden border border-white/15 bg-space-900/90 p-3">
        <div className="pointer-events-none flex justify-between font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-loro">
            CH 1 · CRUSTAL P-WAVE ({preset.eventCode})
          </span>
          <span className="text-regolith/50">SEIS VBB DOME</span>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={128}
          className="my-1.5 h-32 w-full"
          aria-label="InSight SEIS Marsquake seismogram showing crustal and liquid-core reflected waves"
        />

        <div className="pointer-events-none flex justify-between font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-orange-300">
            CH 2 · MANTLE &amp; LIQUID CORE ECHO (ScS)
          </span>
          <span className="text-sunlit/80">{preset.coreNote}</span>
        </div>
      </div>

      <div className="border border-white/15 bg-space-900/50 p-3.5 text-xs leading-relaxed text-regolith/90">
        <p>
          <strong className="font-mono tracking-wider text-sunlit uppercase">
            {preset.label}:
          </strong>{" "}
          {preset.energyNote}
        </p>
      </div>
    </div>
  );
}
