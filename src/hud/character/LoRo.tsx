import { Component, lazy, useEffect, type ReactNode, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useAppStore } from "@/store/useAppStore";
import { LORO_MOODS } from "./moods";

const SurveyorHost3D = lazy(() => import("./SurveyorHost3D"));

interface LoRoProps {
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * While false the canvas stays paused in demand mode and only renders a single
   * warm-up frame, so WebGL context creation, shader compilation, and geometry
   * upload happen before the host becomes visible instead of during an interaction.
   */
  active?: boolean;
}

/** If WebGL is unavailable for the mini-canvas, fall back to the Option 3 Surveyor 3 mascot portrait. */
class HostErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders one frame on mount (after the lazy host resolves, since siblings inside
 * the same Suspense boundary commit together) and whenever `active` flips, so the
 * expensive first GL frame never lands on the "Start Moon Tour" click.
 */
function WarmFrames({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [active, invalidate]);
  return null;
}

/**
 * The lunar host: a live, real-time 3D Surveyor 3 companion mascot (Option 3 — SC-3 · 1967-035A)
 * with glossy white NASA suit, crinkled gold foil chest panels, NASA meatball emblem,
 * top solar panel & parabolic dish hat, waving accordion arm, tripod boot-pods,
 * and glowing LED-matrix cyan eyes + smile that track the pointer, blink, and react to mood.
 */
export default function LoRo({ size = "lg", active = true }: LoRoProps) {
  const mood = useAppStore((s) => s.loroMood);
  const isSpeaking = useAppStore((s) => Boolean(s.dialogue?.isSpeaking));
  const speaker = useAppStore((s) => s.dialogue?.speaker ?? "loro");
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const spec = LORO_MOODS[mood];
  const dim =
    size === "xl"
      ? "h-52 w-52 sm:h-80 sm:w-80"
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
        style={{
          background: `radial-gradient(circle, ${accentHex} 0%, transparent 70%)`,
        }}
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
          dpr={[1, 1.5]}
          frameloop={active ? (reduceMotion ? "demand" : "always") : "demand"}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          onCreated={({ camera }) => camera.lookAt(0, 0.06, 0)}
        >
          <Suspense fallback={null}>
            <SurveyorHost3D
              mood={mood}
              isSpeaking={isSpeaking}
              accent={accentHex}
              reduceMotion={reduceMotion}
            />
            <WarmFrames active={active} />
          </Suspense>
        </Canvas>
      </HostErrorBoundary>
    </div>
  );
}
