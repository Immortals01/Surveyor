import { Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { DoubleSide } from "three";
import { getMachine } from "@/data/machines";
import { useAppStore } from "@/store/useAppStore";
import MachineMascot3D from "@/hud/character/machines/MachineMascot3D";

export const DEEP_SPACE_POSITIONS: Record<string, { x: number; y: number }> = {
  dawn: { x: 22, y: 30 },
  "near-shoemaker": { x: 64, y: 26 },
  pioneer: { x: 34, y: 64 },
  kepler: { x: 73, y: 61 },
};

function Anchored({
  id,
  children,
  scale = 58,
}: {
  id: string;
  children: React.ReactNode;
  scale?: number;
}) {
  const { viewport } = useThree();
  const spot = DEEP_SPACE_POSITIONS[id] ?? { x: 50, y: 50 };
  const fit = Math.min(viewport.width / 900, viewport.height / 640);
  return (
    <group
      position={[
        (spot.x / 100 - 0.5) * viewport.width,
        (0.5 - spot.y / 100) * viewport.height,
        0,
      ]}
      scale={scale * Math.max(0.62, Math.min(1.15, fit))}
    >
      {children}
    </group>
  );
}

function Panel({
  size,
  position,
  rotation,
  color = "#2d5f8b",
}: {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.35} />
    </mesh>
  );
}

function NearShoemaker() {
  return (
    <group rotation={[0.15, -0.5, 0.08]}>
      <Panel size={[0.95, 0.8, 0.9]} position={[0, 0, 0]} color="#b8b2a5" />
      <Panel size={[1.45, 0.55, 0.08]} position={[1.2, 0.2, 0]} color="#234d74" />
      <Panel size={[1.45, 0.55, 0.08]} position={[-1.2, 0.2, 0]} color="#234d74" />
      <Panel size={[0.55, 1.2, 0.08]} position={[0, 1.15, 0]} color="#234d74" />
      <mesh position={[0, -1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.52, 0.16, 20]} />
        <meshStandardMaterial color="#d8d3c7" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0.6, 0.55, 0.35]} rotation={[0.4, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
        <meshStandardMaterial color="#a9a295" />
      </mesh>
    </group>
  );
}

function Pioneer() {
  return (
    <group rotation={[0.2, 0.55, -0.12]}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 1.25, 18]} />
        <meshStandardMaterial color="#c9c3b5" roughness={0.5} metalness={0.45} />
      </mesh>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.14, 32]} />
        <meshStandardMaterial
          color="#e2ddd0"
          roughness={0.35}
          metalness={0.55}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0.9, -0.65, 0]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.09, 0.09, 1.5, 8]} />
        <meshStandardMaterial color="#a9a295" />
      </mesh>
      <mesh position={[1.55, -1.05, 0]}>
        <boxGeometry args={[0.55, 0.4, 0.4]} />
        <meshStandardMaterial color="#5b5b5b" roughness={0.8} />
      </mesh>
      <Panel size={[1.1, 0.3, 0.08]} position={[-1.15, -0.45, 0]} color="#1c3b5c" />
    </group>
  );
}

function Kepler() {
  return (
    <group rotation={[0.15, 0.6, 0.1]}>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.52, 0.52, 1.75, 20]} />
        <meshStandardMaterial color="#b9b3a6" roughness={0.55} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.18, 20]} />
        <meshStandardMaterial color="#e2ddd0" roughness={0.35} metalness={0.5} />
      </mesh>
      <Panel size={[2.5, 0.12, 0.72]} position={[-0.1, -1.0, 0]} color="#1c3b5c" />
      <Panel size={[0.12, 0.55, 0.5]} position={[0.2, -0.58, 0]} color="#8e897e" />
      <mesh position={[1.2, 0.25, 0]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#5ce1ff" emissive="#5ce1ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function DawnModel() {
  const dawn = getMachine("dawn");
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  if (!dawn) return null;
  return (
    <MachineMascot3D
      machine={dawn}
      isSpeaking={false}
      reduceMotion={reduceMotion}
      mood="waving"
      mini
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#fff5df" />
      <directionalLight position={[-4, -2, 2]} intensity={0.8} color="#6f9dff" />
      {Object.entries(DEEP_SPACE_POSITIONS).map(([id]) => (
        <Anchored key={id} id={id} scale={id === "dawn" ? 27 : 29}>
          <Float speed={1.25} rotationIntensity={0.22} floatIntensity={0.35}>
            {id === "dawn" && (
              <Suspense fallback={null}>
                <DawnModel />
              </Suspense>
            )}
            {id === "near-shoemaker" && <NearShoemaker />}
            {id === "pioneer" && <Pioneer />}
            {id === "kepler" && <Kepler />}
          </Float>
        </Anchored>
      ))}
    </>
  );
}

export default function DeepSpaceScene() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 1 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className="pointer-events-none absolute inset-0 z-0"
    >
      <Scene />
    </Canvas>
  );
}
