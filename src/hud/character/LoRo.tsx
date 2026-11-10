import { Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useAppStore } from "@/store/useAppStore";
import { LORO_MOODS } from "./moods";
import SurveyorHost3D from "./SurveyorHost3D";

interface LoRoProps {
  size?: "sm" | "md" | "lg" | "xl";
}

/** If WebGL is unavailable for the mini-canvas, fall back to the Option 3 Surveyor 3 mascot portrait. */
class HostErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The lunar host: a live, real-time 3D Surveyor 3 companion mascot (Option 3 — SC-3 · 1967-035A)
 * with glossy white NASA suit, crinkled gold foil chest panels, NASA meatball emblem,
 * top solar panel & parabolic dish hat, waving accordion arm, tripod boot-pods,
 * and glowing LED-matrix cyan eyes + smile that track the pointer, blink, and react to mood.
 */
export default function LoRo({ size = "lg" }: LoRoProps) {
  const mood = useAppStore((s) => s.loroMood);
  const isSpeaking = useAppStore((s) => Boolean(s.dialogue?.isSpeaking));
  const speaker = useAppStore((s) => s.dialogue?.speaker ?? "loro");
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const spec = LORO_MOODS[mood];
  const dim =
    size === "xl"
      ? "h-52 w-52 sm:h-64 sm:w-64"
      : size === "lg"
        ? "h-40 w-40 sm:h-52 sm:w-52"
        : size === "md"
          ? "h-28 w-28 sm:h-36 sm:w-36"
          : "h-20 w-20 sm:h-24 sm:w-24";

  const accentHex = speaker === "equipment" ? "#ffcf70" : spec.glowColor;

  return (
    <div
      className={`relative select-none ${dim} shrink-0`}
      role="img"
      aria-label={`Surveyor 3, your lunar host (${spec.label})`}
    >
      {/* Ambient telemetry glow behind the host */}
      <div
        className="pointer-events-none absolute inset-5 rounded-full opacity-30 blur-2xl transition-colors duration-500"
        style={{ background: `radial-gradient(circle, ${accentHex} 0%, transparent 70%)` }}
      />

      <HostErrorBoundary
        fallback={
          <img
            src="/images/surveyor-host.webp"
            alt="Surveyor 3 Lunar Host"
            className="h-full w-full object-contain"
          />
        }
      >
        <Canvas
          className="pointer-events-none! absolute! inset-0"
          camera={{ position: [0, 0.14, 4.65], fov: 32 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          onCreated={({ camera }) => camera.lookAt(0, 0.06, 0)}
        >
          <SurveyorHost3D
            mood={mood}
            isSpeaking={isSpeaking}
            accent={accentHex}
            reduceMotion={reduceMotion}
          />
        </Canvas>
      </HostErrorBoundary>

      <div className="pointer-events-none absolute right-1 bottom-0.5 left-1 flex justify-between font-mono text-[8px] tracking-[0.14em] uppercase">
        <span className="text-white/45">SC-3 · 1967</span>
        <span style={{ color: accentHex }}>{spec.label}</span>
      </div>
    </div>
  );
}
