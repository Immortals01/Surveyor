import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import type { Machine } from "@/data/machines";
import { useAppStore } from "@/store/useAppStore";

const MachineMascot3D = lazy(() => import("./MachineMascot3D"));

const SIZES = {
  sm: "h-20 w-20",
  md: "h-28 w-28",
  lg: "h-40 w-40",
  xl: "h-48 w-48 sm:h-56 sm:w-56",
} as const;

class StageErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function WarmFrame({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [active, invalidate]);
  return null;
}

export interface MachineStageProps {
  machine: Machine;
  size?: keyof typeof SIZES;
  isSpeaking?: boolean;
  active?: boolean;
}

/** The glossy 3D character stage used inside the dossier and the cast rail. */
export default function MachineStage({
  machine,
  size = "xl",
  isSpeaking = false,
  active = true,
}: MachineStageProps) {
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  return (
    <div
      className={`relative select-none ${SIZES[size]} shrink-0`}
      role="img"
      aria-label={`${machine.name}, ${machine.categoryLabel} (${machine.status.state})`}
      data-machine={machine.id}
    >
      <div
        className="pointer-events-none absolute inset-5 rounded-full opacity-30 blur-2xl"
        style={{ background: `radial-gradient(circle, ${machine.accent} 0%, transparent 70%)` }}
      />
      <StageErrorBoundary
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 border border-white/10 bg-space-950/80">
            <span className="font-display text-lg font-black tracking-tight" style={{ color: machine.accent }}>
              {machine.name}
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.14em] text-regolith/70 uppercase">
              {machine.categoryLabel}
            </span>
          </div>
        }
      >
        <Canvas
          className="pointer-events-none! absolute! inset-0"
          camera={{ position: [0, 0.08, 4.6], fov: 32 }}
          dpr={[1, 1.5]}
          frameloop={active ? (reduceMotion ? "demand" : "always") : "demand"}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          onCreated={({ camera }) => camera.lookAt(0, 0.02, 0)}
        >
          <Suspense fallback={null}>
            <MachineMascot3D
              machine={machine}
              isSpeaking={isSpeaking}
              reduceMotion={reduceMotion}
              mood={isSpeaking ? "narrating" : "waving"}
            />
            <WarmFrame active={active} />
          </Suspense>
        </Canvas>
      </StageErrorBoundary>
    </div>
  );
}
