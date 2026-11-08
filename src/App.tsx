import { Canvas } from "@react-three/fiber";
import Hud from "@/hud/Hud";
import Scene from "@/scene/Scene";

export default function App() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-space-950 text-regolith">
      <Canvas
        className="absolute inset-0"
        camera={{ fov: 40, near: 0.005, far: 120, position: [3.15, 0.35, 0] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      <Hud />
    </div>
  );
}
