import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { MathUtils, Quaternion, Vector3 } from "three";
import type { Group, MeshBasicMaterial, Texture } from "three";
import type { LoRoMood } from "@/data/schema";
import type { Machine } from "@/data/machines";
import { MascotFace } from "../mascot/parts";
import { getMascotTextures } from "../mascot/textures";

/**
 * Cartoon versions of the real machines, drawn in the same glossy LED-face
 * language as Surveyor 3. Every model is assembled from primitives so the
 * silhouette stays recognisable at tiny map scale and in the dossier stage.
 */

const DARK = "#141b28";
const METAL = "#b8c4d6";
const FOIL = "#d8a63c";
const WHITE = "#eef3fa";

interface FaceProps {
  ledTex: Texture;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  mood: LoRoMood;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  eyeSpacing?: number;
  eyeSize?: number;
  mouthY?: number;
}

/** Blinking, gaze-tracking LED face. Shared by every machine. */
function AnimatedFace({
  ledTex,
  accent,
  isSpeaking,
  reduceMotion,
  mood,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  eyeSpacing = 0.16,
  eyeSize = 0.9,
  mouthY = -0.085,
}: FaceProps) {
  const face = useRef<Group>(null);
  const eyeLeft = useRef<Group>(null);
  const eyeRight = useRef<Group>(null);
  const mouth = useRef<Group>(null);
  const blink = useRef({ next: 1.8, t: -1 });
  const ledMats = useRef<MeshBasicMaterial[]>([]);
  const glowMats = useRef<MeshBasicMaterial[]>([]);

  const registerLed = (m: MeshBasicMaterial | null) => {
    if (m && !ledMats.current.includes(m)) ledMats.current.push(m);
  };
  const registerGlow = (m: MeshBasicMaterial | null) => {
    if (m && !glowMats.current.includes(m)) glowMats.current.push(m);
  };

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const k = (rate: number) => 1 - Math.exp(-rate * d);

    if (blink.current.t < 0 && t > blink.current.next) blink.current.t = 0;
    let blinkAmt = 0;
    if (blink.current.t >= 0) {
      blink.current.t += d;
      const p = blink.current.t / 0.14;
      blinkAmt = p < 1 ? Math.sin(p * Math.PI) : 0;
      if (p >= 1) {
        blink.current.t = -1;
        blink.current.next = t + 2.2 + Math.random() * 3.4;
      }
    }

    const eyeY = Math.max(0.08, (mood === "excited" ? 1.12 : 1) * (1 - blinkAmt * 0.94));
    for (const eye of [eyeLeft.current, eyeRight.current]) {
      if (!eye) continue;
      eye.scale.y = MathUtils.lerp(eye.scale.y, eyeY, k(blinkAmt > 0 ? 38 : 12));
      eye.scale.x = MathUtils.lerp(eye.scale.x, mood === "excited" ? 1.08 : 1, k(12));
    }

    if (mouth.current) {
      const talk = isSpeaking && !reduceMotion
        ? 0.92 + Math.abs(Math.sin(t * 13.5) * 0.7 + Math.cos(t * 8.1) * 0.4)
        : mood === "excited"
          ? 1.15
          : 1;
      mouth.current.scale.y = MathUtils.lerp(mouth.current.scale.y, talk, k(20));
    }

    if (face.current && !reduceMotion) {
      face.current.rotation.y = Math.sin(t * 0.7) * 0.05;
      face.current.rotation.x = Math.sin(t * 0.9 + 1) * 0.03;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <MascotFace
        ledTex={ledTex}
        accent={accent}
        faceRef={face}
        eyeLeftRef={eyeLeft}
        eyeRightRef={eyeRight}
        mouthRef={mouth}
        onLedMat={registerLed}
        onGlowMat={registerGlow}
        eyeSpacing={eyeSpacing}
        eyeSize={eyeSize}
        mouthY={mouthY}
      />
    </group>
  );
}

function SolarPanel({
  solarTex,
  width,
  height,
  position,
  rotation,
}: {
  solarTex: Texture;
  width: number;
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, 0.035, height]} />
        <meshStandardMaterial color="#20345a" metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.94, height * 0.9]} />
        <meshStandardMaterial map={solarTex} metalness={0.45} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Strut({
  from,
  to,
  radius = 0.025,
  color = METAL,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const dir = useMemo(() => {
    const x = to[0] - from[0];
    const y = to[1] - from[1];
    const z = to[2] - from[2];
    const len = Math.hypot(x, y, z) || 1;
    return { x: x / len, y: y / len, z: z / len };
  }, [from, to]);
  const quaternion = useMemo(() => {
    const q = new Quaternion();
    q.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(dir.x, dir.y, dir.z));
    return q;
  }, [dir]);
  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

function Wheel({
  radius,
  width,
  position,
  innerRef,
  color = "#3b3f47",
}: {
  radius: number;
  width: number;
  position: [number, number, number];
  innerRef?: (el: Group | null) => void;
  color?: string;
}) {
  return (
    <group ref={innerRef} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, width, 16]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius * 0.82, 0.016, 8, 16]} />
        <meshStandardMaterial color={METAL} metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, width * 1.08, 10]} />
        <meshStandardMaterial color="#d9d2bd" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function RoverMast({ height, accent }: { height: number; accent: string }) {
  return (
    <group>
      <mesh position={[0, height / 2 + 0.18, 0.02]}>
        <cylinderGeometry args={[0.025, 0.032, height, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, height + 0.18, 0.02]}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color={accent} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Ingenuity                                                           */
/* ------------------------------------------------------------------ */

function IngenuityModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
  solarTex,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  solarTex: Texture;
}) {
  const upper = useRef<Group>(null);
  const lower = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const speed = isSpeaking && !reduceMotion ? 15 : reduceMotion ? 0.6 : 1.8;
    if (upper.current) upper.current.rotation.y += dt * speed;
    if (lower.current) lower.current.rotation.y -= dt * speed * 0.9;
    if (root.current) {
      root.current.rotation.z = Math.sin(t * 1.1) * 0.035;
      root.current.rotation.x = Math.sin(t * 0.8 + 1.4) * 0.03;
    }
  });

  return (
    <group ref={root} position={[0, -0.42, 0]}>
      {/* four landing legs */}
      {[
        [-0.42, -0.65, 0.32],
        [0.42, -0.65, 0.32],
        [-0.42, -0.65, -0.3],
        [0.42, -0.65, -0.3],
      ].map(([x = 0, y = 0, z = 0], i) => (
        <group key={i}>
          <Strut from={[x * 0.4, 0.04, z * 0.42]} to={[x * 0.8, y, z * 1.25]} radius={0.018} />
          <mesh position={[x * 0.8, y - 0.01, z * 1.25]}>
            <cylinderGeometry args={[0.075, 0.085, 0.03, 12]} />
            <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* body and gold foil belly */}
      <RoundedBox args={[0.42, 0.3, 0.26]} radius={0.07} position={[0, 0.12, 0]}>
        <meshPhysicalMaterial color={WHITE} roughness={0.18} clearcoat={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.12, -0.17]}>
        <boxGeometry args={[0.4, 0.26, 0.04]} />
        <meshStandardMaterial color={FOIL} metalness={0.75} roughness={0.35} />
      </mesh>

      {/* face in the little camera bay */}
      {renderFace({ position: [0, 0.12, 0.15], scale: 0.92 })}
      <mesh position={[0, 0.1, 0.135]}>
        <boxGeometry args={[0.24, 0.16, 0.02]} />
        <meshStandardMaterial color="#0a1220" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* rotor mast */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.032, 0.045, 0.34, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.61, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color={accent} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* counter-rotating blades */}
      <group ref={upper} position={[0, 0.59, 0]}>
        {[0, Math.PI].map((r) => (
          <group key={r} rotation={[0, r, 0]}>
            <mesh position={[0, 0, 0.46]}>
              <boxGeometry args={[0.045, 0.008, 0.9]} />
              <meshStandardMaterial color="#1b2230" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.004, 0.88]}>
              <boxGeometry args={[0.055, 0.006, 0.06]} />
              <meshStandardMaterial color={accent} metalness={0.3} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={lower} position={[0, 0.52, 0]}>
        {[Math.PI / 2, Math.PI * 1.5].map((r) => (
          <group key={r} rotation={[0, r, 0]}>
            <mesh position={[0, 0, 0.46]}>
              <boxGeometry args={[0.045, 0.008, 0.9]} />
              <meshStandardMaterial color="#1b2230" metalness={0.4} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* solar panel above the rotors */}
      <SolarPanel solarTex={solarTex} width={0.5} height={0.34} position={[0, 0.7, 0]} />
      <mesh position={[0, 0.68, 0.16]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
        <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Viking 1                                                            */
/* ------------------------------------------------------------------ */

function VikingModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
}) {
  const dish = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame((state, _dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.32 + Math.sin(t * 1.35) * 0.02;
      root.current.rotation.y = Math.sin(t * 0.5) * 0.04;
    }
    if (dish.current && !reduceMotion) {
      dish.current.rotation.y = Math.sin(t * 0.55) * 0.28;
      dish.current.rotation.x = -0.28 + Math.sin(t * 0.8) * 0.06;
    }
    if (arm.current) {
      arm.current.rotation.x = MathUtils.lerp(
        arm.current.rotation.x,
        isSpeaking && !reduceMotion ? -0.45 + Math.sin(t * 3) * 0.12 : -0.2,
        0.06,
      );
    }
  });

  return (
    <group ref={root} position={[0, -0.32, 0]}>
      {/* three landing legs */}
      {[0, Math.PI * (2 / 3), Math.PI * (4 / 3)].map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <Strut from={[0, 0.16, 0.42]} to={[0, -0.5, 0.82]} radius={0.035} />
          <Strut from={[0, 0.02, 0.38]} to={[0, -0.24, 0.68]} radius={0.022} color="#8fa0b8" />
          <mesh position={[0, -0.52, 0.82]}>
            <cylinderGeometry args={[0.13, 0.15, 0.05, 14]} />
            <meshPhysicalMaterial color={WHITE} roughness={0.25} clearcoat={0.7} />
          </mesh>
          <mesh position={[0, -0.55, 0.82]}>
            <cylinderGeometry args={[0.15, 0.15, 0.018, 14]} />
            <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* hexagonal instrument deck */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.58, 0.62, 0.22, 6]} />
        <meshStandardMaterial color={WHITE} metalness={0.1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.18, 0]} scale={[1.01, 0.6, 1.01]}>
        <cylinderGeometry args={[0.58, 0.58, 0.22, 6]} />
        <meshStandardMaterial color={FOIL} metalness={0.7} roughness={0.45} />
      </mesh>

      {/* gold-foil instrument boxes on the deck */}
      <RoundedBox args={[0.26, 0.2, 0.24]} radius={0.03} position={[-0.18, 0.4, 0.04]}>
        <meshStandardMaterial color={FOIL} metalness={0.75} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.16, 0.2]} radius={0.02} position={[0.2, 0.38, -0.04]}>
        <meshStandardMaterial color="#c9d4e4" metalness={0.5} roughness={0.4} />
      </RoundedBox>

      {/* face on the front of the deck */}
      {renderFace({ position: [0, 0.2, 0.575], scale: 1.15 })}
      <mesh position={[0, 0.2, 0.55]}>
        <boxGeometry args={[0.44, 0.26, 0.03]} />
        <meshStandardMaterial color="#070d18" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* sampler arm */}
      <group ref={arm} position={[0.34, 0.12, 0.34]} rotation={[-0.2, -0.3, 0]}>
        <Strut from={[0, 0, 0]} to={[0.55, -0.12, 0.55]} radius={0.022} />
        <Strut from={[0.55, -0.12, 0.55]} to={[0.98, -0.42, 0.72]} radius={0.018} />
        <mesh position={[1.02, -0.44, 0.74]}>
          <boxGeometry args={[0.09, 0.06, 0.12]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* high-gain dish */}
      <group ref={dish} position={[0.16, 0.52, -0.05]}>
        <Strut from={[0, -0.18, 0]} to={[0, 0.14, 0]} radius={0.028} />
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.3, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.22} metalness={0.1} clearcoat={0.8} side={2} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.014, 8, 22]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.01, 0.02, 0.22, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* RTG power booms */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Strut from={[side * 0.5, 0.3, -0.25]} to={[side * 0.95, 0.32, -0.45]} radius={0.018} />
          <mesh position={[side * 0.98, 0.31, -0.48]} rotation={[0.2, 0, side * 0.2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.24, 10]} />
            <meshStandardMaterial color="#4b4a46" metalness={0.5} roughness={0.6} />
          </mesh>
          {[0.05, -0.05].map((x, i) => (
            <mesh key={i} position={[side * (1.06 + x * 0), 0.31, -0.48]}>
              <boxGeometry args={[0.01, 0.22, 0.2]} />
              <meshStandardMaterial color={accent} metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* InSight                                                             */
/* ------------------------------------------------------------------ */

function InsightModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
  solarTex,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  solarTex: Texture;
}) {
  const arm = useRef<Group>(null);
  const dome = useRef<Group>(null);
  const root = useRef<Group>(null);

  useFrame((state, _dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.5 + Math.sin(t * 1.1) * 0.018;
    }
    if (dome.current && !reduceMotion) {
      dome.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
      dome.current.rotation.y = Math.sin(t * 0.4) * 0.04;
    }
    if (arm.current) {
      arm.current.rotation.z = MathUtils.lerp(
        arm.current.rotation.z,
        isSpeaking && !reduceMotion ? 0.14 + Math.sin(t * 2.2) * 0.08 : 0.06,
        0.05,
      );
    }
  });

  return (
    <group ref={root} position={[0, -0.5, 0]}>
      {/* octagonal deck */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.46, 0.5, 0.18, 8]} />
        <meshStandardMaterial color={WHITE} metalness={0.15} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.08, 8]} />
        <meshStandardMaterial color="#c9d4e4" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* face */}
      {renderFace({ position: [0, 0.23, 0.405], scale: 0.95 })}
      <mesh position={[0, 0.23, 0.39]}>
        <boxGeometry args={[0.34, 0.2, 0.03]} />
        <meshStandardMaterial color="#070d18" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* two big circular solar wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.58, 0.3, 0]} rotation={[0, 0, side * -0.2]}>
          <Strut from={[-side * 0.1, 0, 0]} to={[side * 0.18, 0.02, 0]} radius={0.024} />
          <mesh position={[side * 0.52, 0.02, 0]} scale={[1, 0.06, 1]}>
            <cylinderGeometry args={[0.56, 0.56, 0.5, 28]} />
            <meshStandardMaterial color="#20345a" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[side * 0.52, 0.04, 0]} rotation={[0, 0, 0]}>
            <circleGeometry args={[0.52, 28]} />
            <meshStandardMaterial map={solarTex} metalness={0.4} roughness={0.28} />
          </mesh>
        </group>
      ))}

      {/* robotic arm reaching to the seismometer */}
      <group ref={arm} position={[0.22, 0.2, 0.24]} rotation={[0, -0.4, 0.06]}>
        <Strut from={[0, 0, 0]} to={[0.16, -0.18, 0.32]} radius={0.02} />
        <Strut from={[0.16, -0.18, 0.32]} to={[0.1, -0.4, 0.55]} radius={0.016} />
        <mesh position={[0.08, -0.42, 0.58]}>
          <boxGeometry args={[0.08, 0.05, 0.1]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* SEIS dome in front, on the ground */}
      <group ref={dome} position={[-0.05, -0.2, 0.62]}>
        <mesh scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.27, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#cf8a3a" roughness={0.28} metalness={0.6} clearcoat={0.75} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.275, 0.018, 8, 22]} />
          <meshStandardMaterial color="#f0d4a0" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color={accent} metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* wind and thermal shield skirt */}
      <mesh position={[-0.05, -0.29, 0.62]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.34, 0.07, 22]} />
        <meshStandardMaterial color="#9a7a4a" metalness={0.55} roughness={0.45} />
      </mesh>

      {/* antenna */}
      <group position={[-0.3, 0.4, -0.12]} rotation={[0.2, 0.4, -0.3]}>
        <Strut from={[0, -0.1, 0]} to={[0, 0.18, 0]} radius={0.02} />
        <mesh position={[0, 0.24, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.18, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.2} clearcoat={0.8} side={2} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dawn                                                                */
/* ------------------------------------------------------------------ */

function DawnModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
  solarTex,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  solarTex: Texture;
}) {
  const root = useRef<Group>(null);
  const wings = useRef<Group>(null);
  const ion = useRef<Group>(null);

  useFrame((state, _dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.3 + Math.sin(t * 0.8) * 0.03;
      root.current.rotation.z = Math.sin(t * 0.45) * 0.035;
    }
    if (wings.current && !reduceMotion) {
      wings.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    }
    if (ion.current) {
      const pulse = 1 + Math.sin(t * (isSpeaking ? 8 : 3)) * 0.18;
      ion.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={root} position={[0, -0.3, 0]}>
      {/* central body */}
      <RoundedBox args={[0.5, 0.42, 0.44]} radius={0.06} position={[0, 0.32, 0]}>
        <meshStandardMaterial color={FOIL} metalness={0.65} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.22, 0.34]} radius={0.04} position={[0, 0.24, 0.12]}>
        <meshStandardMaterial color={WHITE} metalness={0.2} roughness={0.42} />
      </RoundedBox>

      {/* face */}
      {renderFace({ position: [0, 0.3, 0.292], scale: 0.9 })}
      <mesh position={[0, 0.3, 0.275]}>
        <boxGeometry args={[0.3, 0.18, 0.02]} />
        <meshStandardMaterial color="#070d18" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* ion engine nozzle + glow */}
      <group ref={ion} position={[0, 0.18, -0.36]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.08, 0.18, 16, 1, true]} />
          <meshStandardMaterial color="#6b7485" metalness={0.8} roughness={0.3} side={2} />
        </mesh>
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[0.075, 16]} />
          <meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      </group>

      {/* huge solar array wings */}
      <group ref={wings}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.4, 0.34, 0]} rotation={[0, 0, side * 0.08]}>
            <Strut from={[0, 0, 0]} to={[side * 0.25, 0, 0]} radius={0.03} />
            <mesh position={[side * 0.95, 0, 0]}>
              <boxGeometry args={[1.4, 0.03, 0.5]} />
              <meshStandardMaterial color="#20345a" metalness={0.55} roughness={0.32} />
            </mesh>
            <mesh position={[side * 0.95, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.34, 0.44]} />
              <meshStandardMaterial map={solarTex} metalness={0.45} roughness={0.26} />
            </mesh>
            {[-0.3, 0.3].map((z) => (
              <mesh key={z} position={[side * 1.55, 0, z]}>
                <boxGeometry args={[0.02, 0.035, 0.45]} />
                <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* high-gain dish on a mast */}
      <group position={[0, 0.62, -0.02]} rotation={[0.25, 0, 0]}>
        <Strut from={[0, -0.12, 0]} to={[0, 0.15, 0]} radius={0.02} />
        <mesh position={[0, 0.22, 0]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.2} clearcoat={0.8} side={2} />
        </mesh>
      </group>

      {/* star trackers / thrusters */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.24, 0.18, 0.1]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sojourner                                                           */
/* ------------------------------------------------------------------ */

function SojournerModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
  solarTex,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  solarTex: Texture;
}) {
  const wheels = useRef<(Group | null)[]>([]);
  const root = useRef<Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const spin = reduceMotion ? 0.2 : isSpeaking ? 1.6 : 0.6;
    wheels.current.forEach((w) => {
      if (w) w.rotation.x += dt * spin;
    });
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.55 + Math.sin(t * 1.7) * 0.018;
    }
  });

  return (
    <group ref={root} position={[0, -0.55, 0]}>
      {/* six small wheels and rocker-bogie bars */}
      {[-1, 1].map((side) =>
        [-0.3, 0.02, 0.34].map((z, i) => (
          <group key={`${side}-${i}`}>
            <Wheel
              radius={0.12}
              width={0.08}
              position={[side * 0.33, 0.06, z]}
              innerRef={(el) => {
                wheels.current[i + (side === 1 ? 3 : 0)] = el;
              }}
            />
            <Strut from={[side * 0.18, 0.18, 0]} to={[side * 0.3, 0.08, z]} radius={0.014} />
          </group>
        )),
      )}

      {/* low body */}
      <RoundedBox args={[0.42, 0.24, 0.48]} radius={0.05} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#d9d4c4" metalness={0.35} roughness={0.45} />
      </RoundedBox>

      {/* solar deck */}
      <SolarPanel solarTex={solarTex} width={0.5} height={0.42} position={[0, 0.43, 0]} />

      {/* face */}
      {renderFace({ position: [0, 0.3, 0.258], scale: 0.86 })}
      <mesh position={[0, 0.3, 0.245]}>
        <boxGeometry args={[0.3, 0.16, 0.02]} />
        <meshStandardMaterial color="#070d18" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* mast camera */}
      <RoverMast height={0.45} accent={accent} />
      <mesh position={[0, 0.6, 0.02]}>
        <boxGeometry args={[0.13, 0.08, 0.1]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0.08]}>
        <circleGeometry args={[0.035, 12]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      {/* APXS instrument on the front */}
      <Strut from={[0.14, 0.3, 0.2]} to={[0.18, 0.12, 0.32]} radius={0.014} />
      <mesh position={[0.18, 0.1, 0.34]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* little antenna */}
      <Strut from={[-0.16, 0.4, -0.16]} to={[-0.2, 0.7, -0.2]} radius={0.01} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Spirit & Opportunity                                                */
/* ------------------------------------------------------------------ */

function MerModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
  solarTex,
  variant,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
  solarTex: Texture;
  variant: "spirit" | "opportunity";
}) {
  const wheels = useRef<(Group | null)[]>([]);
  const root = useRef<Group>(null);
  const arm = useRef<Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const spin = reduceMotion ? 0.15 : isSpeaking ? 1.2 : 0.45;
    wheels.current.forEach((w) => {
      if (w) w.rotation.x += dt * spin;
    });
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.55 + Math.sin(t * 1.3) * 0.02;
      root.current.rotation.z = Math.sin(t * 0.7) * 0.015;
    }
    if (arm.current) {
      arm.current.rotation.x = MathUtils.lerp(
        arm.current.rotation.x,
        isSpeaking && !reduceMotion ? -0.35 + Math.sin(t * 2.4) * 0.12 : -0.15,
        0.05,
      );
    }
  });

  const shell = variant === "spirit" ? "#d8c7a6" : "#dfe8f2";
  const deck = variant === "spirit" ? "#c9a56a" : "#9fc4d8";

  return (
    <group ref={root} position={[0, -0.55, 0]}>
      {/* six wheels */}
      {[-1, 1].map((side) =>
        [-0.4, 0.0, 0.4].map((z, i) => (
          <group key={`${side}-${i}`}>
            <Wheel
              radius={0.18}
              width={0.12}
              position={[side * 0.48, 0.02, z]}
              innerRef={(el) => {
                wheels.current[i + (side === 1 ? 3 : 0)] = el;
              }}
              color={variant === "spirit" ? "#4a3f34" : "#3f4752"}
            />
            <Strut from={[side * 0.24, 0.28, 0]} to={[side * 0.44, 0.06, z]} radius={0.022} />
          </group>
        )),
      )}

      {/* rocker-bogie frame */}
      <Strut from={[-0.3, 0.3, 0]} to={[0.3, 0.3, 0]} radius={0.02} color={METAL} />

      {/* body */}
      <RoundedBox args={[0.62, 0.3, 0.56]} radius={0.06} position={[0, 0.38, 0]}>
        <meshStandardMaterial color={shell} metalness={0.3} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.1, 0.46]} radius={0.03} position={[0, 0.22, 0.02]}>
        <meshStandardMaterial color={deck} metalness={0.4} roughness={0.4} />
      </RoundedBox>

      {/* solar deck */}
      <SolarPanel solarTex={solarTex} width={0.78} height={0.52} position={[0, 0.56, 0]} />

      {/* mast with the expressive Pancam head */}
      <Strut from={[0.2, 0.5, -0.1]} to={[0.2, 0.95, -0.1]} radius={0.022} />
      <group position={[0.2, 1.02, -0.08]}>
        <RoundedBox args={[0.3, 0.18, 0.18]} radius={0.04}>
          <meshStandardMaterial color={shell} metalness={0.25} roughness={0.4} />
        </RoundedBox>
        {renderFace({ position: [0, 0, 0.1], scale: 0.72 })}
        <mesh position={[0, 0, 0.095]}>
          <boxGeometry args={[0.24, 0.14, 0.02]} />
          <meshStandardMaterial color="#070d18" metalness={0.4} roughness={0.3} />
        </mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0, 0.115]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
            <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* robotic arm */}
      <group ref={arm} position={[0.22, 0.28, 0.28]} rotation={[-0.15, -0.2, 0]}>
        <Strut from={[0, 0, 0]} to={[0.2, -0.16, 0.3]} radius={0.016} />
        <Strut from={[0.2, -0.16, 0.3]} to={[0.1, -0.32, 0.44]} radius={0.014} />
        <mesh position={[0.08, -0.34, 0.46]}>
          <boxGeometry args={[0.09, 0.05, 0.11]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* high-gain antenna */}
      <group position={[-0.22, 0.62, -0.12]} rotation={[0.2, -0.4, 0.25]}>
        <Strut from={[0, -0.05, 0]} to={[0, 0.12, 0]} radius={0.014} />
        <mesh position={[0, 0.17, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.2} clearcoat={0.8} side={2} />
        </mesh>
      </group>

      {variant === "spirit" ? (
        <mesh position={[0.44, -0.16, 0.42]} rotation={[0.5, 0, 0.2]}>
          <boxGeometry args={[0.12, 0.06, 0.05]} />
          <meshStandardMaterial color={FOIL} metalness={0.6} roughness={0.5} />
        </mesh>
      ) : (
        <mesh position={[-0.3, 0.56, 0.2]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color={accent} metalness={0.3} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Apollo Command Module (Columbia)                                    */
/* ------------------------------------------------------------------ */

function ApolloCsmModel({
  renderFace,
  accent,
  isSpeaking: _isSpeaking,
  reduceMotion,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
}) {
  const root = useRef<Group>(null);
  const antenna = useRef<Group>(null);

  useFrame((state, _dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.5 + Math.sin(t * 0.9) * 0.04;
      root.current.rotation.y = Math.sin(t * 0.35) * 0.06;
    }
    if (antenna.current && !reduceMotion) {
      antenna.current.rotation.y = Math.sin(t * 0.6) * 0.18;
    }
  });

  return (
    <group ref={root} position={[0, -0.5, 0]}>
      {/* service module */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.52, 0.56, 0.78, 20]} />
        <meshStandardMaterial color={WHITE} metalness={0.35} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.8, 20, 1, true]} />
        <meshStandardMaterial color={FOIL} metalness={0.7} roughness={0.45} side={2} />
      </mesh>
      {/* engine bell */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 0.32, 20, 1, true]} />
        <meshStandardMaterial color="#5e6674" metalness={0.85} roughness={0.28} side={2} />
      </mesh>
      {/* command module cone */}
      <mesh position={[0, 0.62, 0]}>
        <coneGeometry args={[0.56, 0.62, 20]} />
        <meshPhysicalMaterial color={WHITE} metalness={0.3} roughness={0.25} clearcoat={0.7} />
      </mesh>
      <mesh position={[0, 0.93, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 0.16, 12]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* windows and face */}
      <group position={[0, 0.62, 0.3]} rotation={[-0.16, 0, 0]}>
        <mesh position={[0, 0, 0.15]}>
          <boxGeometry args={[0.44, 0.26, 0.04]} />
          <meshStandardMaterial color="#070d18" metalness={0.5} roughness={0.25} />
        </mesh>
        {renderFace({ position: [0, 0, 0.23], scale: 1.0 })}
      </group>
      {/* RCS thrusters */}
      {[
        [0.36, 0.34, 0.2],
        [-0.36, 0.34, 0.2],
        [0.36, 0.34, -0.2],
        [-0.36, 0.34, -0.2],
      ].map(([x = 0, y = 0, z = 0], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* high-gain antenna */}
      <group ref={antenna} position={[0.36, 0.02, -0.25]} rotation={[0.2, 0.4, -0.3]}>
        <Strut from={[0, -0.12, 0]} to={[0, 0.14, 0]} radius={0.018} />
        <mesh position={[0, 0.22, 0]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.19, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.2} clearcoat={0.8} side={2} />
        </mesh>
      </group>
      <mesh position={[0.2, 0.72, 0.05]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color={accent} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Apollo Lunar Module (Falcon)                                        */
/* ------------------------------------------------------------------ */

function ApolloLmModel({
  renderFace,
  accent,
  isSpeaking,
  reduceMotion,
}: {
  renderFace: (props?: Partial<FaceProps>) => React.ReactNode;
  accent: string;
  isSpeaking: boolean;
  reduceMotion: boolean;
}) {
  const root = useRef<Group>(null);
  const dish = useRef<Group>(null);
  const rcs = useRef<Group>(null);

  useFrame((state, _dt) => {
    const t = state.clock.elapsedTime;
    if (root.current && !reduceMotion) {
      root.current.position.y = -0.55 + Math.sin(t * 1.2) * 0.018;
    }
    if (dish.current && !reduceMotion) {
      dish.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }
    if (rcs.current) {
      rcs.current.rotation.z = isSpeaking && !reduceMotion ? Math.sin(t * 5) * 0.08 : Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group ref={root} position={[0, -0.55, 0]}>
      {/* descent stage */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.36, 8]} />
        <meshStandardMaterial color={FOIL} metalness={0.7} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.06, 8]} />
        <meshStandardMaterial color="#c9d4e4" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* four legs */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <group key={i} rotation={[0, a + Math.PI / 4, 0]}>
          <Strut from={[0.35, 0.22, 0]} to={[0.82, -0.55, 0]} radius={0.033} />
          <Strut from={[0.38, 0.38, 0]} to={[0.66, -0.2, 0]} radius={0.02} color="#9aa7b8" />
          <mesh position={[0.84, -0.56, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.05, 14]} />
            <meshPhysicalMaterial color={WHITE} roughness={0.25} clearcoat={0.7} />
          </mesh>
        </group>
      ))}

      {/* ladder */}
      <group position={[0.46, 0.08, 0.22]} rotation={[0.15, -0.5, 0]}>
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
            <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ascent stage */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.3, 0.38, 0.4, 8]} />
        <meshPhysicalMaterial color={WHITE} metalness={0.3} roughness={0.32} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.2, 8]} />
        <meshStandardMaterial color="#cfd9e8" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* face through the triangular window */}
      {renderFace({ position: [0, 0.74, 0.31], scale: 0.9 })}
      <mesh position={[0, 0.74, 0.295]}>
        <boxGeometry args={[0.26, 0.16, 0.02]} />
        <meshStandardMaterial color="#070d18" metalness={0.5} roughness={0.25} />
      </mesh>

      {/* docking tunnel top hat */}
      <mesh position={[0, 1.14, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.12, 12]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* RCS quads */}
      <group ref={rcs}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.42, 0.92, 0]}>
            <mesh>
              <boxGeometry args={[0.14, 0.1, 0.14]} />
              <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.3} />
            </mesh>
            {[0.08, -0.08].map((y) => (
              <mesh key={y} position={[side * 0.06, y, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.028, 0.06, 8]} />
                <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.25} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* steerable dish antenna */}
      <group ref={dish} position={[-0.34, 0.96, 0.12]} rotation={[0.3, -0.3, -0.3]}>
        <Strut from={[0, -0.06, 0]} to={[0, 0.1, 0]} radius={0.014} />
        <mesh position={[0, 0.16, 0]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial color={WHITE} roughness={0.2} clearcoat={0.8} side={2} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export interface MachineMascotProps {
  machine: Machine;
  isSpeaking: boolean;
  reduceMotion: boolean;
  mood?: LoRoMood;
  mini?: boolean;
}

export default function MachineMascot3D({
  machine,
  isSpeaking,
  reduceMotion,
  mood = "narrating",
  mini = false,
}: MachineMascotProps) {
  const { scene } = useThree();
  const { ledTex, solarTex, envTex } = getMascotTextures();

  useEffect(() => {
    // Dossier stages own their scene, so they can safely use the mascot env map.
    // Characters standing on the Moon/Mars must not replace the main scene
    // environment or they brighten the whole globe.
    if (mini) return;
    const prev = scene.environment;
    scene.environment = envTex;
    return () => {
      scene.environment = prev;
    };
  }, [scene, envTex, mini]);

  const faceProps: FaceProps = {
    ledTex,
    accent: machine.accent,
    isSpeaking,
    reduceMotion,
    mood,
  };

  const renderFace = (props: Partial<FaceProps> = {}) => (
    <AnimatedFace {...faceProps} {...props} />
  );

  return (
    <>
      {!mini && (
        <>
          <hemisphereLight args={["#e8f1ff", "#1a2436", 1.1]} />
          <directionalLight position={[3.5, 5.5, 4.5]} intensity={2.3} color="#ffffff" />
          <directionalLight position={[-4, 2.5, -2]} intensity={1.2} color={machine.accent} />
          <pointLight position={[0, 0.5, 2.4]} intensity={1.3} distance={5} color={machine.accent} />
        </>
      )}

      {!mini && !reduceMotion && (
        <Sparkles
          count={16}
          scale={[3.2, 2.8, 1.4]}
          position={[0, 0.22, -0.9]}
          size={1.4}
          speed={0.2}
          opacity={0.5}
          color={machine.accent}
        />
      )}

      {machine.modelKey === "ingenuity" && (
        <IngenuityModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} />
      )}
      {machine.modelKey === "viking" && (
        <VikingModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} />
      )}
      {machine.modelKey === "insight" && (
        <InsightModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} />
      )}
      {machine.modelKey === "dawn" && (
        <DawnModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} />
      )}
      {machine.modelKey === "sojourner" && (
        <SojournerModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} />
      )}
      {machine.modelKey === "mer" && (
        <MerModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} variant="spirit" />
      )}
      {machine.modelKey === "mer-b" && (
        <MerModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} solarTex={solarTex} variant="opportunity" />
      )}
      {machine.modelKey === "apollo-csm" && (
        <ApolloCsmModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} />
      )}
      {machine.modelKey === "apollo-lm" && (
        <ApolloLmModel renderFace={renderFace} accent={machine.accent} isSpeaking={isSpeaking} reduceMotion={reduceMotion} />
      )}
    </>
  );
}
