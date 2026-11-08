import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Hud from "@/hud/Hud";
import { Fallback2DMoonMap, SceneErrorBoundary } from "@/scene/CanvasFallback";
import Scene from "@/scene/Scene";

export default function App() {
  const [contextLost, setContextLost] = useState(false);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-space-950 text-regolith">
      {contextLost ? (
        <Fallback2DMoonMap />
      ) : (
        <SceneErrorBoundary>
          <Canvas
            className="absolute inset-0"
            camera={{ fov: 40, near: 0.005, far: 120, position: [3.15, 0.35, 0] }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              const el = gl.domElement;
              el.addEventListener("webglcontextlost", (e) => {
                e.preventDefault();
                setContextLost(true);
              });
            }}
          >
            <Scene />
          </Canvas>
        </SceneErrorBoundary>
      )}
      <Hud />
    </div>
  );
}
