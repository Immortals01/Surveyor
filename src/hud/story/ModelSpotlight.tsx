import { Component, type ReactNode, Suspense, useMemo } from "react";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Box, Rotate3d } from "lucide-react";
import type { HeroSite } from "@/data/schema";
import { detectDefaultQualityTier } from "@/lib/quality";
import { useAppStore } from "@/store/useAppStore";

interface ModelSpotlightProps {
  model3d: NonNullable<HeroSite["model3d"]>;
  fallbackImage: string;
}

function GlbScene({ glbPath, scale }: { glbPath: string; scale: number }) {
  const { scene } = useGLTF(glbPath);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <group>
      <Center top>
        <primitive object={cloned} scale={scale} />
      </Center>
      {/* Subtle Lunar Regolith Pedestal Disc */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1.65, 1.8, 0.08, 40]} />
        <meshStandardMaterial color="#3b362e" roughness={0.92} metalness={0.05} />
      </mesh>
    </group>
  );
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function ModelSpotlight({
  model3d,
  fallbackImage,
}: ModelSpotlightProps) {
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const qualitySetting = useAppStore((s) => s.settings.qualityTier);
  const openSources = useAppStore((s) => s.openSources);

  const effectiveTier =
    qualitySetting === "auto" ? detectDefaultQualityTier() : qualitySetting;

  const fallbackCard = (
    <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-space-900 p-4 text-center">
      <img
        src={fallbackImage}
        alt={model3d.title}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="relative z-10 rounded-xl border border-white/15 bg-space-950/85 p-4 backdrop-blur-md">
        <Box className="mx-auto h-6 w-6 text-sunlit" />
        <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
          {model3d.title}
        </p>
        <p className="mt-1 text-xs text-regolith/75">
          2D diagram fallback active for low-memory graphics mode.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {effectiveTier === "low" ? (
        fallbackCard
      ) : (
        <ModelErrorBoundary fallback={fallbackCard}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-loro/35 bg-gradient-to-b from-space-900 to-space-950 shadow-inner">
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center font-mono text-xs text-loro">
                  Loading 3D spacecraft model...
                </div>
              }
            >
              <Canvas
                camera={{ position: [2.6, 1.7, 2.6], fov: 38 }}
                dpr={[1, 1.5]}
              >
                <ambientLight intensity={0.75} />
                <directionalLight position={[4, 6, 3]} intensity={2.4} color="#fff4dc" />
                <directionalLight position={[-3, 2, -4]} intensity={0.8} color="#5ce1ff" />
                <GlbScene glbPath={model3d.glbPath} scale={model3d.scale} />
                <OrbitControls
                  enablePan={false}
                  minDistance={1.6}
                  maxDistance={5.2}
                  autoRotate={!reduceMotion}
                  autoRotateSpeed={1.1}
                />
              </Canvas>
            </Suspense>

            <div className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-loro/35 bg-space-950/85 px-2.5 py-1 font-mono text-[10px] text-loro backdrop-blur-md">
              <Rotate3d className="h-3.5 w-3.5" />
              <span>Drag to rotate · Scroll/pinch to zoom</span>
            </div>
          </div>
        </ModelErrorBoundary>
      )}

      <div className="rounded-xl border border-white/10 bg-space-900/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-bold text-regolith-bright">
            {model3d.title}
          </h4>
          <button
            type="button"
            onClick={() => openSources(model3d.sourceId)}
            className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro hover:border-loro"
          >
            NASA 3D Source
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-regolith/85">
          {model3d.caption}
        </p>
      </div>
    </div>
  );
}
