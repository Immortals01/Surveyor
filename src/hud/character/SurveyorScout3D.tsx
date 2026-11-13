import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { Color, DoubleSide, MathUtils } from "three";
import type { Group, MeshBasicMaterial } from "three";
import type { LoRoMood } from "@/data/schema";
import type { HostCharacter, SurveyorHeadgear } from "@/data/hosts";
import { BellowsArm, MascotFace, TripodLeg } from "./mascot/parts";
import { getMascotTextures } from "./mascot/textures";

/**
 * The little tripod robot family — Surveyor 1, Surveyor 7 (and the shared rig
 * behind Surveyor 3). Same friendly Astro-Bot silhouette as the mission host:
 * glossy shell, dark glass visor, glowing LED-matrix eyes and smile, gold foil
 * chest panels, accordion arms and chunky tripod boot-pods — with a per-machine
 * headgear silhouette so each scout is instantly recognisable.
 */

export interface SurveyorScoutProps {
  host: HostCharacter;
  mood: LoRoMood;
  isSpeaking: boolean;
  accent: string;
  reduceMotion: boolean;
}

const VISOR_BLACK = "#050913";
const DARK_METAL = "#1a2232";

function Headgear({
  variant,
  host,
  solarTex,
  groupRef,
}: {
  variant: SurveyorHeadgear;
  host: HostCharacter;
  solarTex: ReturnType<typeof getMascotTextures>["solarTex"];
  groupRef?: React.RefObject<Group | null>;
}) {
  if (variant === "solar-dish") {
    return (
      <group ref={groupRef} position={[-0.28, 0.5, 0.02]} rotation={[0.28, 0.18, 0.38]}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 0.12, 12]} />
          <meshStandardMaterial color={host.trim} metalness={0.6} roughness={0.3} />
        </mesh>
        <RoundedBox args={[0.56, 0.026, 0.34]} radius={0.01} position={[-0.06, 0.03, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <mesh position={[-0.06, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.53, 0.31]} />
          <meshStandardMaterial map={solarTex} roughness={0.2} metalness={0.35} />
        </mesh>
      </group>
    );
  }

  if (variant === "dish") {
    /* Surveyor 1: one big sun-catching dish and a slender whip antenna. */
    return (
      <group ref={groupRef}>
        <group position={[0.26, 0.44, 0.01]} rotation={[0.3, -0.3, -0.42]}>
          <mesh position={[0, -0.09, 0]}>
            <cylinderGeometry args={[0.034, 0.05, 0.2, 12]} />
            <meshStandardMaterial color={host.trim} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0]} scale={[1, 0.4, 1]}>
            <sphereGeometry args={[0.26, 22, 14, 0, Math.PI * 2, Math.PI * 0.46, Math.PI * 0.54]} />
            <meshPhysicalMaterial
              color={host.shell}
              roughness={0.2}
              metalness={0.08}
              clearcoat={0.85}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.016, 8, 22]} />
            <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.85} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.01, 0.022, 0.2, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.026, 12, 8]} />
            <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
          </mesh>
        </group>

        {/* Whip antenna with a friendly little beacon */}
        <mesh position={[-0.2, 0.62, -0.06]}>
          <cylinderGeometry args={[0.006, 0.01, 0.5, 8]} />
          <meshStandardMaterial color={host.trim} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[-0.2, 0.87, -0.06]}>
          <sphereGeometry args={[0.028, 12, 10]} />
          <meshStandardMaterial
            color={host.accent}
            emissive={host.accent}
            emissiveIntensity={1.3}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  }

  /* Surveyor 7: a camera mast instead of a dish, plus a survey-scoop arm. */
  return (
    <group ref={groupRef}>
      <group position={[0.16, 0.5, 0.02]} rotation={[-0.12, 0, 0.16]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.028, 0.04, 0.22, 10]} />
          <meshStandardMaterial color={host.trim} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0.01]}>
          <boxGeometry args={[0.14, 0.11, 0.18]} />
          <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
        </mesh>
        <mesh position={[0, 0.2, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
          <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0.14]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={host.accent} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      </group>

      {/* Slim high-gain blade antenna */}
      <mesh position={[-0.23, 0.56, -0.13]} rotation={[0.06, 0, -0.22]}>
        <boxGeometry args={[0.012, 0.26, 0.08]} />
        <meshStandardMaterial color={host.shell} metalness={0.25} roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function SurveyorScout3D({
  host,
  mood,
  isSpeaking,
  accent,
  reduceMotion,
}: SurveyorScoutProps) {
  const { gl, scene } = useThree();
  const { ledTex, nasaTex, solarTex, foilBump, envTex, shadowTex } = getMascotTextures();

  useEffect(() => {
    const prevEnv = scene.environment;
    scene.environment = envTex;
    return () => {
      scene.environment = prevEnv;
    };
  }, [scene, envTex]);

  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const faceGroup = useRef<Group>(null);
  const eyeLeft = useRef<Group>(null);
  const eyeRight = useRef<Group>(null);
  const mouthGroup = useRef<Group>(null);
  const waveShoulder = useRef<Group>(null);
  const waveElbow = useRef<Group>(null);
  const restShoulder = useRef<Group>(null);
  const headgear = useRef<Group>(null);
  const ledMats = useRef<MeshBasicMaterial[]>([]);
  const glowMats = useRef<MeshBasicMaterial[]>([]);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const blink = useRef({ next: 1.6, t: -1 });
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
      const phase = Math.floor(t / 2.9);
      gx = 0.2 + Math.sin(phase * 12.9898) * 0.34;
      gy = 0.1 + Math.cos(phase * 4.1414) * 0.22;
      if (mood === "scanning") {
        gx = Math.sin(t * 1.4) * 0.85;
        gy = -0.12;
      } else if (mood === "nostalgic") {
        gx = 0.18;
        gy = 0.36;
      }
    }
    if (reduceMotion) {
      gx *= 0.3;
      gy *= 0.3;
    }

    if (faceGroup.current) {
      faceGroup.current.position.x = MathUtils.lerp(faceGroup.current.position.x, gx * 0.085, k(16));
      faceGroup.current.position.y = MathUtils.lerp(
        faceGroup.current.position.y,
        -0.01 + gy * 0.06,
        k(16),
      );
    }

    if (head.current) {
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, gx * 0.55, k(8));
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, -gy * 0.36, k(8));
      const tilt =
        MathUtils.degToRad(mood === "nostalgic" ? -6 : 3) -
        gx * 0.07 +
        (isSpeaking && !reduceMotion ? Math.sin(t * 2.4) * 0.04 : -0.03);
      head.current.rotation.z = MathUtils.lerp(head.current.rotation.z, tilt, k(6));
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
        b.next = t + 2.1 + Math.random() * 3.2;
      }
    }
    const baseY = mood === "excited" ? 1.12 : mood === "nostalgic" ? 0.8 : 1.0;
    const eyeY = Math.max(0.06, baseY * (1 - blinkAmt * 0.94));
    for (const eye of [eyeLeft, eyeRight]) {
      if (!eye.current) continue;
      eye.current.scale.y = MathUtils.lerp(eye.current.scale.y, eyeY, k(blinkAmt > 0 ? 38 : 12));
      eye.current.scale.x = MathUtils.lerp(
        eye.current.scale.x,
        mood === "excited" ? 1.08 : 1 + blinkAmt * 0.12,
        k(14),
      );
    }

    if (mouthGroup.current) {
      const talkY = isSpeaking
        ? 0.9 + Math.abs(Math.sin(t * 14) * 0.6 + Math.cos(t * 8.5) * 0.45)
        : mood === "excited" || mood === "waving"
          ? 1.15
          : 1.0;
      mouthGroup.current.scale.y = MathUtils.lerp(mouthGroup.current.scale.y, talkY, k(20));
    }

    if (root.current) {
      const bobAmp = reduceMotion ? 0 : mood === "excited" ? 0.05 : 0.022;
      const bobRate = mood === "excited" ? 5 : 1.7;
      const bob =
        mood === "excited" ? Math.abs(Math.sin(t * bobRate)) * bobAmp : Math.sin(t * bobRate) * bobAmp;
      root.current.position.y = -0.05 + bob;
      root.current.rotation.y = MathUtils.lerp(
        root.current.rotation.y,
        gx * 0.3 + (reduceMotion ? 0 : Math.sin(t * 0.6) * 0.04),
        k(5),
      );
    }

    if (waveShoulder.current && waveElbow.current) {
      const waving = !reduceMotion && (mood === "waving" || mood === "excited" || isSpeaking);
      const osc = waving
        ? Math.sin(t * (mood === "excited" ? 8 : 5.4)) * 0.3
        : Math.sin(t * 1.4) * 0.05;
      waveShoulder.current.rotation.z = MathUtils.lerp(
        waveShoulder.current.rotation.z,
        (waving ? 0.5 : 0.26) + osc * 0.35,
        k(7),
      );
      waveElbow.current.rotation.z = MathUtils.lerp(waveElbow.current.rotation.z, 0.78 + osc, k(11));
    }

    if (restShoulder.current && !reduceMotion) {
      restShoulder.current.rotation.z = MathUtils.lerp(
        restShoulder.current.rotation.z,
        0.45 + Math.sin(t * 1.6 + 1.2) * 0.035,
        k(6),
      );
    }

    if (headgear.current && !reduceMotion) {
      headgear.current.rotation.z = MathUtils.lerp(
        headgear.current.rotation.z,
        (host.headgear === "mast-scoop" ? 0.16 : 0.38) + Math.sin(t * 0.9) * 0.035,
        k(4),
      );
    }
  });

  return (
    <>
      <hemisphereLight args={["#e8f1ff", "#1a2436", 1.05]} />
      <directionalLight position={[3.5, 5.5, 4.5]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[-4, 2.5, -2]} intensity={1.35} color={activeColor} />
      <pointLight position={[0, 0.5, 2.4]} intensity={1.4} distance={5} color={activeColor} />

      {!reduceMotion && (
        <Sparkles
          count={22}
          scale={[3.2, 2.9, 1.5]}
          position={[0, 0.25, -0.9]}
          size={1.5}
          speed={0.24}
          opacity={0.6}
          color={host.accent}
        />
      )}

      <group ref={root} position={[0, -0.05, 0]}>
        {/* HEAD */}
        <group ref={head} position={[0, 0.56, 0]}>
          <mesh scale={[1.1, 0.93, 0.96]}>
            <sphereGeometry args={[0.56, 28, 20]} />
            <meshPhysicalMaterial
              color={host.shell}
              roughness={0.15}
              metalness={0.04}
              clearcoat={0.95}
              clearcoatRoughness={0.08}
            />
          </mesh>

          <RoundedBox
            args={[0.92, 0.56, 0.24]}
            radius={0.26}
            smoothness={4}
            position={[0, -0.01, 0.36]}
          >
            <meshPhysicalMaterial color="#dce4f0" roughness={0.22} metalness={0.1} clearcoat={0.8} />
          </RoundedBox>

          <RoundedBox
            args={[0.86, 0.5, 0.22]}
            radius={0.23}
            smoothness={4}
            position={[0, -0.01, 0.39]}
          >
            <meshPhysicalMaterial
              color={VISOR_BLACK}
              roughness={0.08}
              metalness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
            />
          </RoundedBox>

          <mesh position={[0.16, 0.12, 0.502]} rotation={[0, 0, -0.22]}>
            <planeGeometry args={[0.24, 0.07]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.11} />
          </mesh>

          <MascotFace
            ledTex={ledTex}
            accent={activeColor}
            faceRef={faceGroup}
            eyeLeftRef={eyeLeft}
            eyeRightRef={eyeRight}
            mouthRef={mouthGroup}
            onLedMat={registerLed}
            onGlowMat={registerGlow}
            eyeSpacing={0.16}
            eyeSize={0.92}
          />

          <Headgear variant={host.headgear} host={host} solarTex={solarTex} groupRef={headgear} />
        </group>

        {/* NECK COLLAR */}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.028, 10, 24]} />
          <meshStandardMaterial color={host.trim} metalness={0.55} roughness={0.32} />
        </mesh>

        {/* TORSO */}
        <group position={[0, -0.24, 0]}>
          <RoundedBox args={[0.88, 0.52, 0.68]} radius={0.18} smoothness={4}>
            <meshPhysicalMaterial
              color={host.shell}
              roughness={0.16}
              metalness={0.05}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
            />
          </RoundedBox>

          <RoundedBox
            args={[0.25, 0.27, 0.06]}
            radius={0.025}
            position={[-0.24, 0.01, 0.325]}
            rotation={[0, -0.18, 0]}
          >
            <meshStandardMaterial
              color={host.foil}
              metalness={0.92}
              roughness={0.26}
              bumpMap={foilBump}
              bumpScale={0.025}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.25, 0.27, 0.06]}
            radius={0.025}
            position={[0.24, 0.01, 0.325]}
            rotation={[0, 0.18, 0]}
          >
            <meshStandardMaterial
              color={host.foil}
              metalness={0.92}
              roughness={0.26}
              bumpMap={foilBump}
              bumpScale={0.025}
            />
          </RoundedBox>

          <group position={[0, 0.04, 0.35]}>
            <RoundedBox args={[0.25, 0.23, 0.055]} radius={0.035} smoothness={4}>
              <meshPhysicalMaterial color={host.shell} roughness={0.18} clearcoat={0.9} />
            </RoundedBox>
            <mesh position={[0, 0, 0.029]}>
              <circleGeometry args={[0.088, 24]} />
              <meshStandardMaterial map={nasaTex} roughness={0.25} metalness={0.05} />
            </mesh>
          </group>

          <RoundedBox args={[0.14, 0.055, 0.03]} radius={0.01} position={[0, -0.135, 0.34]}>
            <meshStandardMaterial
              color={host.foil}
              metalness={0.9}
              roughness={0.28}
              bumpMap={foilBump}
              bumpScale={0.015}
            />
          </RoundedBox>

          {/* Backpack */}
          <group position={[-0.04, 0.02, -0.36]}>
            <RoundedBox args={[0.52, 0.38, 0.18]} radius={0.06}>
              <meshPhysicalMaterial color={host.shell} roughness={0.2} clearcoat={0.85} />
            </RoundedBox>
            <mesh position={[-0.265, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
              <meshBasicMaterial ref={registerLed} color={activeColor} />
            </mesh>
          </group>
        </group>

        <BellowsArm
          side="left"
          shoulderRef={restShoulder}
          shell={host.shell}
          bellows={host.trim}
          trim={host.trim}
          accessory={host.headgear === "mast-scoop" ? "scoop" : null}
        />
        <BellowsArm
          side="right"
          shoulderRef={waveShoulder}
          elbowRef={waveElbow}
          shell={host.shell}
          bellows={host.trim}
          trim={host.trim}
        />

        <TripodLeg
          hipPos={[-0.26, -0.5, -0.02]}
          kneePos={[-0.38, -0.66, 0.02]}
          anklePos={[-0.48, -0.8, 0.05]}
          footPos={[-0.56, -0.84, 0.09]}
          footRotY={-0.45}
          shell={host.shell}
          bellows={host.trim}
          trim={host.trim}
        />
        <TripodLeg
          hipPos={[0.26, -0.5, -0.02]}
          kneePos={[0.38, -0.66, 0.02]}
          anklePos={[0.48, -0.8, 0.05]}
          footPos={[0.56, -0.84, 0.09]}
          footRotY={0.45}
          shell={host.shell}
          bellows={host.trim}
          trim={host.trim}
        />
        <TripodLeg
          hipPos={[0.02, -0.5, 0.14]}
          kneePos={[0.05, -0.68, 0.22]}
          anklePos={[0.08, -0.82, 0.28]}
          footPos={[0.1, -0.88, 0.36]}
          footRotY={0.08}
          shell={host.shell}
          bellows={host.trim}
          trim={host.trim}
        />
      </group>

      <mesh position={[0, -1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </>
  );
}
