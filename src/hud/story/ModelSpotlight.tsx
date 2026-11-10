import { Component, type ReactNode, Suspense, useMemo } from "react";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Box, Rotate3d } from "lucide-react";
import { CylinderGeometry, MeshStandardMaterial } from "three";
import type { HeroSite } from "@/data/schema";
import { detectDefaultQualityTier } from "@/lib/quality";
import { useAppStore } from "@/store/useAppStore";

interface ModelSpotlightProps {
  model3d: NonNullable<HeroSite["model3d"]>;
  fallbackImage: string;
}

const PEDESTAL_GEO = new CylinderGeometry(1.65, 1.8, 0.08, 32);
const PEDESTAL_MAT = new MeshStandardMaterial({
  color: "#3b362e",
  roughness: 0.92,
  metalness: 0.05,
});

function GlbScene({ glbPath, scale }: { glbPath: string; scale: number }) {
  const { scene } = useGLTF(glbPath);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <group>
      <Center top>
        <primitive object={cloned} scale={scale} />
      </Center>
      {/* Subtle Lunar Regolith Pedestal Disc */}
      <mesh
        position={[0, -0.04, 0]}
        geometry={PEDESTAL_GEO}
        material={PEDESTAL_MAT}
      />
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
    <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden border border-white/15 bg-space-900 p-4 text-center">
      <img
        src={fallbackImage}
        alt={model3d.title}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="relative z-10 border border-white/20 bg-space-950/90 p-4 backdrop-blur-md">
        <Box className="mx-auto h-5 w-5 text-sunlit" />
        <p className="mt-1.5 font-display text-sm font-bold text-regolith-bright">
          {model3d.title}
        </p>
        <p className="mt-1 font-mono text-[10px] tracking-wider text-regolith/70 uppercase">
          2D ARCHIVAL DIAGRAM · LOW-MEMORY GRAPHICS MODE
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {effectiveTier === "low" ? (
        fallbackCard
      ) : (
        <ModelErrorBoundary fallback={fallbackCard}>
          <div className="border border-white/15 bg-space-950 p-1.5">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-gradient-to-b from-space-900 to-space-950">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center font-mono text-[11px] tracking-[0.14em] text-loro uppercase">
                    INITIALIZING CAD GEOMETRY...
                  </div>
                }
              >
                <Canvas
                  camera={{ position: [2.6, 1.7, 2.6], fov: 38 }}
                  dpr={[1, 1.5]}
                  frameloop={reduceMotion ? "demand" : "always"}
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

              <div className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1.5 border border-white/15 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-regolith-bright uppercase backdrop-blur-md">
                <Rotate3d className="h-3 w-3 text-loro" />
                <span>INTERACTIVE CAD · DRAG TO ORBIT / SCROLL TO ZOOM</span>
              </div>
            </div>
          </div>
        </ModelErrorBoundary>
      )}

      <div className="border border-white/15 bg-space-950/85 p-3.5">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
          <div>
            <div className="font-mono text-[9.5px] tracking-[0.16em] text-sunlit uppercase">
              FLIGHT HARDWARE GEOMETRY
            </div>
            <h4 className="mt-0.5 font-display text-sm font-bold text-regolith-bright">
              {model3d.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => openSources(model3d.sourceId)}
            className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:bg-loro/15 hover:text-white"
          >
            NASA 3D ARCHIVE
          </button>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-regolith/90">
          {model3d.caption}
        </p>
      </div>
    </div>
  );
}
