import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { Color, DoubleSide, MathUtils } from "three";
import type { Group, MeshBasicMaterial } from "three";
import type { LoRoMood } from "@/data/schema";
import type { HostCharacter } from "@/data/hosts";
import { MascotFace } from "./mascot/parts";
import { getNamePlateTexture, getMascotTextures } from "./mascot/textures";

/**
 * Cartoon lunar-module mascots — Eagle (Tranquility Base), Intrepid and Antares.
 *
 * Each is a friendly eight-sided descent stage: crinkled gold thermal foil hull,
 * four splayed landing legs with chunky feet, a docking-tunnel "top hat", RCS
 * quad "ears", a parabolic dish, a little ladder, and the same glowing LED-matrix
 * face as the tripod scouts so the whole cast feels like one family.
 */

const VISOR_BLACK = "#050913";
const DARK_METAL = "#141b28";

function LmLeg({ angle, host }: { angle: number; host: HostCharacter }) {
  /* Built in local space pointing down + out, then rotated into place. */
  const strutTilt = Math.atan2(0.3, 0.76);

  return (
    <group rotation={[0, angle, 0]}>
      {/* Hip bracket where the strut meets the descent-stage hull */}
      <mesh position={[0, -0.13, 0.4]} rotation={[strutTilt, 0, 0]}>
        <cylinderGeometry args={[0.058, 0.05, 0.12, 10]} />
        <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Primary strut: hull edge (0,-0.16,0.42) → foot (0,-0.92,0.72) */}
      <mesh position={[0, -0.54, 0.57]} rotation={[strutTilt, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.045, 0.82, 10]} />
        <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Secondary diagonal brace from the hull to mid-strut */}
      <mesh position={[0, -0.36, 0.5]} rotation={[strutTilt + 0.55, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color={host.trim} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Ankle post + chunky foot pad */}
      <group position={[0, -0.92, 0.72]}>
        <mesh position={[0, 0.03, 0]} rotation={[strutTilt, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.1, 10]} />
          <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.15, 0.17, 0.055, 16]} />
          <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, -0.035, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
          <meshStandardMaterial color={host.trim} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** The little ladder Neil and Buzz climbed down, parked against the front-left face. */
function LmLadder({ host }: { host: HostCharacter }) {
  return (
    <group position={[-0.36, -0.5, 0.55]} rotation={[0.12, -0.34, 0]}>
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.62, 8]} />
          <meshStandardMaterial color="#e8edf5" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      {[-0.24, -0.12, 0, 0.12, 0.24].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
          <meshStandardMaterial color={host.accent} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Tiny RCS thruster quad — the mascot's "ears". */
function RcsQuad({
  position,
  rotation,
  host,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  host: HostCharacter;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
        <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.3} />
      </mesh>
      {(
        [
          [0.1, 0.06, 0.06],
          [-0.1, 0.06, 0.06],
          [0.1, -0.06, -0.06],
          [-0.1, -0.06, -0.06],
        ] as [number, number, number][]
      ).map(([x, y, z], i) => (
        <mesh
          key={i}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1, 1, 1]}
        >
          <coneGeometry args={[0.032, 0.08, 8]} />
          <meshStandardMaterial color={host.trim} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export interface LunarModuleMascotProps {
  host: HostCharacter;
  mood: LoRoMood;
  isSpeaking: boolean;
  accent: string;
  reduceMotion: boolean;
}

export default function LunarModuleMascot3D({
  host,
  mood,
  isSpeaking,
  accent,
  reduceMotion,
}: LunarModuleMascotProps) {
  const { gl, scene } = useThree();
  const { ledTex, foilBump, envTex, shadowTex } = getMascotTextures();
  const namePlate = useMemo(
    () => getNamePlateTexture(host.name, host.accent),
    [host.name, host.accent],
  );

  useEffect(() => {
    const prevEnv = scene.environment;
    scene.environment = envTex;
    return () => {
      scene.environment = prevEnv;
    };
  }, [scene, envTex]);

  const root = useRef<Group>(null);
  const faceGroup = useRef<Group>(null);
  const eyeLeft = useRef<Group>(null);
  const eyeRight = useRef<Group>(null);
  const mouthGroup = useRef<Group>(null);
  const waveArm = useRef<Group>(null);
  const dish = useRef<Group>(null);
  const ledMats = useRef<MeshBasicMaterial[]>([]);
  const glowMats = useRef<MeshBasicMaterial[]>([]);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const blink = useRef({ next: 1.5, t: -1 });
  const targetColor = useMemo(() => new Color(), []);

  useEffect(() => {
    let rect = gl.domElement.getBoundingClientRect();
    let winW = window.innerWidth;
    let winH = window.innerHeight;
    const refresh = () => {
      rect = gl.domElement.getBoundingClientRect();
      winW = window.innerWidth;
      winH = window.innerHeight;
    };
    const onMove = (e: PointerEvent) => {
      if (rect.width === 0) refresh();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.44;
      const dx = e.clientX - cx;
      const dy = cy - e.clientY;
      const zDepth = Math.min(winW, winH) * 0.22;
      const len = Math.hypot(dx, dy, zDepth) || 1;
      pointer.current.x = MathUtils.clamp(dx / len, -1, 1);
      pointer.current.y = MathUtils.clamp(dy / len, -1, 1);
      pointer.current.active = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", refresh);
    };
  }, [gl]);

  const registerLed = (m: MeshBasicMaterial | null) => {
    if (m && !ledMats.current.includes(m)) ledMats.current.push(m);
  };
  const registerGlow = (m: MeshBasicMaterial | null) => {
    if (m && !glowMats.current.includes(m)) glowMats.current.push(m);
  };

  const activeColor = accent || host.accent;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const k = (rate: number) => 1 - Math.exp(-rate * d);

    targetColor.set(activeColor);
    for (const m of ledMats.current) m.color.lerp(targetColor, k(8));
    for (const m of glowMats.current) m.color.lerp(targetColor, k(8));

    let gx = pointer.current.x;
    let gy = pointer.current.y;
    if (!pointer.current.active) {
      const phase = Math.floor(t / 3);
      gx = 0.18 + Math.sin(phase * 12.9898) * 0.3;
      gy = 0.12 + Math.cos(phase * 4.1414) * 0.2;
      if (mood === "scanning") {
        gx = Math.sin(t * 1.3) * 0.8;
        gy = -0.1;
      } else if (mood === "nostalgic") {
        gx = 0.15;
        gy = 0.35;
      }
    }
    if (reduceMotion) {
      gx *= 0.3;
      gy *= 0.3;
    }

    if (faceGroup.current) {
      faceGroup.current.position.x = MathUtils.lerp(faceGroup.current.position.x, gx * 0.1, k(16));
      faceGroup.current.position.y = MathUtils.lerp(
        faceGroup.current.position.y,
        0.03 + gy * 0.07,
        k(16),
      );
    }

    const b = blink.current;
    if (b.t < 0 && t > b.next) b.t = 0;
    let blinkAmt = 0;
    if (b.t >= 0) {
      b.t += d;
      const p = b.t / 0.15;
      blinkAmt = p < 1 ? Math.sin(p * Math.PI) : 0;
      if (p >= 1) {
        b.t = -1;
        b.next = t + 2.2 + Math.random() * 3.2;
      }
    }
    const baseY = mood === "excited" ? 1.1 : mood === "nostalgic" ? 0.82 : 1.0;
    const eyeY = Math.max(0.06, baseY * (1 - blinkAmt * 0.94));
    for (const eye of [eyeLeft, eyeRight]) {
      if (!eye.current) continue;
      eye.current.scale.y = MathUtils.lerp(eye.current.scale.y, eyeY, k(blinkAmt > 0 ? 38 : 12));
    }

    if (mouthGroup.current) {
      const talkY = isSpeaking
        ? 0.92 + Math.abs(Math.sin(t * 13) * 0.6 + Math.cos(t * 8) * 0.4)
        : mood === "excited" || mood === "waving"
          ? 1.14
          : 1.0;
      mouthGroup.current.scale.y = MathUtils.lerp(mouthGroup.current.scale.y, talkY, k(20));
    }

    if (root.current) {
      const bobAmp = reduceMotion ? 0 : mood === "excited" ? 0.045 : 0.018;
      const bobRate = mood === "excited" ? 4.6 : 1.5;
      const bob =
        mood === "excited"
          ? Math.abs(Math.sin(t * bobRate)) * bobAmp
          : Math.sin(t * bobRate) * bobAmp;
      root.current.position.y = 0.14 + bob;
      root.current.rotation.y = MathUtils.lerp(
        root.current.rotation.y,
        gx * 0.16 + (reduceMotion ? 0 : Math.sin(t * 0.5) * 0.03),
        k(4),
      );
      root.current.rotation.z = MathUtils.lerp(root.current.rotation.z, gx * -0.03, k(4));
    }

    if (waveArm.current) {
      const waving = !reduceMotion && (mood === "waving" || mood === "excited" || isSpeaking);
      const osc = waving
        ? Math.sin(t * (mood === "excited" ? 7.5 : 5)) * 0.28
        : Math.sin(t * 1.3) * 0.05;
      waveArm.current.rotation.z = MathUtils.lerp(
        waveArm.current.rotation.z,
        (waving ? 0.62 : 0.24) + osc,
        k(7),
      );
    }

    if (dish.current && !reduceMotion) {
      dish.current.rotation.y = MathUtils.lerp(
        dish.current.rotation.y,
        -0.2 + gx * 0.4 + Math.sin(t * 1.1) * 0.08,
        k(5),
      );
    }
  });

  return (
    <>
      <hemisphereLight args={["#eef4ff", "#171f2c", 1.0]} />
      <directionalLight position={[3.4, 5.2, 4.6]} intensity={2.3} color="#ffffff" />
      <directionalLight position={[-4, 2.4, -2]} intensity={1.3} color={activeColor} />
      <pointLight position={[0, 0.4, 2.6]} intensity={1.3} distance={5} color={activeColor} />

      {!reduceMotion && (
        <Sparkles
          count={20}
          scale={[3.1, 2.8, 1.5]}
          position={[0, 0.3, -0.9]}
          size={1.5}
          speed={0.22}
          opacity={0.55}
          color={host.accent}
        />
      )}

      <group ref={root} scale={1.18} position={[0, 0.14, 0]}>
        {/* ==================== EIGHT-SIDED DESCENT STAGE ==================== */}
        <group position={[0, 0.02, 0]}>
          {/* Gold foil hull */}
          <mesh rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.62, 0.56, 0.7, 8]} />
            <meshStandardMaterial
              color={host.foil}
              metalness={0.88}
              roughness={0.34}
              bumpMap={foilBump}
              bumpScale={0.03}
            />
          </mesh>

          {/* Upper quad deck ring */}
          <mesh position={[0, 0.36, 0]} rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.44, 0.52, 0.09, 8]} />
            <meshStandardMaterial
              color={host.foil}
              metalness={0.9}
              roughness={0.3}
              bumpMap={foilBump}
              bumpScale={0.02}
            />
          </mesh>

          {/* Docking-tunnel "top hat" */}
          <group position={[0, 0.46, 0]}>
            <mesh rotation={[0, Math.PI / 8, 0]}>
              <cylinderGeometry args={[0.2, 0.23, 0.16, 8]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.85} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <torusGeometry args={[0.19, 0.026, 10, 22]} />
              <meshStandardMaterial color={host.trim} metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <circleGeometry args={[0.17, 22]} />
              <meshStandardMaterial color={DARK_METAL} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>

          {/* RCS quad "ears" */}
          <RcsQuad position={[0.42, 0.28, 0.42]} rotation={[0, -0.35, 0.1]} host={host} />
          <RcsQuad position={[-0.42, 0.28, 0.42]} rotation={[0, 0.35, -0.1]} host={host} />
          <RcsQuad position={[0.42, 0.28, -0.42]} rotation={[0, -2.8, 0.1]} host={host} />

          {/* Front visor bezel + glass + friendly face */}
          <RoundedBox args={[0.74, 0.46, 0.16]} radius={0.2} smoothness={4} position={[0, 0.05, 0.58]}>
            <meshPhysicalMaterial color={host.shell} roughness={0.24} metalness={0.2} clearcoat={0.7} />
          </RoundedBox>
          <RoundedBox args={[0.66, 0.38, 0.14]} radius={0.17} smoothness={4} position={[0, 0.05, 0.63]}>
            <meshPhysicalMaterial
              color={VISOR_BLACK}
              roughness={0.08}
              metalness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
            />
          </RoundedBox>
          <mesh position={[0.13, 0.15, 0.705]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.22, 0.06]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
          </mesh>

          <group>
            <MascotFace
              ledTex={ledTex}
              accent={activeColor}
              faceRef={faceGroup}
              eyeLeftRef={eyeLeft}
              eyeRightRef={eyeRight}
              mouthRef={mouthGroup}
              onLedMat={registerLed}
              onGlowMat={registerGlow}
              position={[0, 0.03, 0.74]}
              eyeSpacing={0.15}
              eyeSize={0.95}
              mouthY={-0.1}
              glowStrength={0.4}
            />
          </group>

          {/* Mission name plate */}
          <mesh position={[0, -0.235, 0.615]} rotation={[-0.04, 0, 0]}>
            <planeGeometry args={[0.52, 0.12]} />
            <meshStandardMaterial map={namePlate} roughness={0.35} metalness={0.1} />
          </mesh>

          {/* Small orange-black hazard stripe band */}
          <mesh position={[0, -0.32, 0]} rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.574, 0.566, 0.024, 8]} />
            <meshStandardMaterial color={host.accent} metalness={0.4} roughness={0.5} />
          </mesh>

          {/* Descent engine bell peeking out underneath */}
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 0.2, 16]} />
            <meshStandardMaterial color={DARK_METAL} metalness={0.75} roughness={0.35} />
          </mesh>

          {/* Parabolic dish antenna */}
          <group ref={dish} position={[-0.36, 0.5, -0.12]} rotation={[0.2, -0.3, 0.34]}>
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.024, 0.03, 0.1, 10]} />
              <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.06, 0]} scale={[1, 0.42, 1]}>
              <sphereGeometry args={[0.19, 20, 12, 0, Math.PI * 2, Math.PI * 0.46, Math.PI * 0.54]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.85} side={DoubleSide} />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.19, 0.012, 8, 20]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.85} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
            </mesh>
          </group>

          {/* Whip antenna with glowing tip */}
          <mesh position={[0.4, 0.62, -0.2]} rotation={[0, 0, -0.22]}>
            <cylinderGeometry args={[0.006, 0.009, 0.42, 8]} />
            <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, 0.82, -0.2]}>
            <sphereGeometry args={[0.024, 10, 8]} />
            <meshStandardMaterial
              color={host.accent}
              emissive={host.accent}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>

          {/* Friendly little service arm (waving) */}
          <group ref={waveArm} position={[0.55, 0.04, 0.1]} rotation={[0, 0, 0.34]}>
            {/* Shoulder bracket so the arm visibly belongs to the hull */}
            <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.06, 12]} />
              <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
            </mesh>
            {[0.07, 0.14, 0.21, 0.28].map((o, i) => (
              <mesh key={i} position={[o, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.062, 0.056, 0.06, 12]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? host.trim : "#7e8a9b"}
                  metalness={0.55}
                  roughness={0.35}
                />
              </mesh>
            ))}
            {/* Wrist cuff + mitten palm */}
            <mesh position={[0.335, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 12]} />
              <meshStandardMaterial color={host.accent} metalness={0.45} roughness={0.35} />
            </mesh>
            <mesh position={[0.415, 0, 0]} scale={[1.05, 0.95, 0.8]}>
              <sphereGeometry args={[0.095, 14, 10]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
            </mesh>
          </group>

          {/* Resting service arm on the other side */}
          <group position={[-0.55, 0.04, 0.1]} rotation={[0, 0, -0.42]}>
            <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.06, 12]} />
              <meshStandardMaterial color={host.trim} metalness={0.7} roughness={0.3} />
            </mesh>
            {[0.07, 0.14, 0.21, 0.28].map((o, i) => (
              <mesh key={i} position={[-o, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.062, 0.056, 0.06, 12]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? host.trim : "#7e8a9b"}
                  metalness={0.55}
                  roughness={0.35}
                />
              </mesh>
            ))}
            <mesh position={[-0.335, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 12]} />
              <meshStandardMaterial color={host.accent} metalness={0.45} roughness={0.35} />
            </mesh>
            <mesh position={[-0.415, 0, 0]} scale={[1.05, 0.95, 0.8]}>
              <sphereGeometry args={[0.095, 14, 10]} />
              <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
            </mesh>
          </group>

          {/* Eagle keeps a little flag of its own */}
          {host.id === "eagle" && (
            <group position={[-0.5, 0.34, 0.3]} rotation={[0, 0.4, 0.14]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
                <meshStandardMaterial color="#d7dde8" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.16, 0.11]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[0.22, 0.13]} />
                <meshStandardMaterial
                  color="#e8eef7"
                  emissive="#1f3a7a"
                  emissiveIntensity={0.25}
                  side={DoubleSide}
                />
              </mesh>
            </group>
          )}
        </group>

        {/* ==================== FOUR SPLAYED LANDING LEGS ==================== */}
        <LmLeg angle={Math.PI / 4} host={host} />
        <LmLeg angle={(Math.PI * 3) / 4} host={host} />
        <LmLeg angle={(Math.PI * 5) / 4} host={host} />
        <LmLeg angle={(Math.PI * 7) / 4} host={host} />
        <LmLadder host={host} />
      </group>

      <mesh position={[0, -1.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.62} depthWrite={false} />
      </mesh>
    </>
  );
}
