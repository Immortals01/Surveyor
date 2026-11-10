import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  EquirectangularReflectionMapping,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import type { Group, MeshBasicMaterial } from "three";
import type { LoRoMood } from "@/data/schema";
import { LORO_MOODS } from "./moods";

/**
 * Real-time 3D Lunar Host (Option 3 — Retro-Futuristic Space Mascot / Astro Bot Style):
 * - Glossy white rounded astronaut-robot helmet with recessed dark glass visor
 * - Glowing digital cyan LED-matrix oval eyes (pointer-tracking + blinking) & curved LED smile mouth
 * - Top-left tilted 3x5 blue photovoltaic solar panel & top-right white parabolic dish antenna with feed horn
 * - Cylindrical white space-suit torso with crinkled gold thermal foil chest panels, raised NASA meatball badge, and 4 corner bolts
 * - Segmented ribbed accordion-bellows arms with 4-fingered robot hands (right arm waves!)
 * - Three articulated tripod legs with circular mechanical knee/ankle joints and chunky rounded boot-pods
 */

export interface SurveyorHostProps {
  mood: LoRoMood;
  isSpeaking: boolean;
  accent: string;
  reduceMotion: boolean;
}

const WHITE_SHELL = "#f2f6fc";
const BELLOWS_GREY = "#9ba6b5";
const DARK_METAL = "#1a2232";
const VISOR_BLACK = "#050913";
const GOLD_FOIL = "#e6b43c";

interface MascotTextures {
  ledTex: CanvasTexture;
  nasaTex: CanvasTexture;
  solarTex: CanvasTexture;
  foilBump: CanvasTexture;
  envTex: CanvasTexture;
  shadowTex: CanvasTexture;
}

let cachedMascotTextures: MascotTextures | null = null;

/** Procedural textures for the LED dot-matrix eyes, NASA meatball emblem, 3x5 solar grid, crinkled gold foil, studio reflections, and floor shadow. */
function getMascotTextures(): MascotTextures {
  if (cachedMascotTextures) return cachedMascotTextures;

  // 1. Digital LED pixel-matrix texture for the glowing cyan eyes
  const ledCanvas = document.createElement("canvas");
  ledCanvas.width = 128;
  ledCanvas.height = 160;
  const lctx = ledCanvas.getContext("2d")!;
  lctx.clearRect(0, 0, 128, 160);
  const cols = 13;
  const rows = 17;
  const cx = 64;
  const cy = 80;
  const rx = 56;
  const ry = 72;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = 12 + (c / (cols - 1)) * 104;
      const py = 12 + (r / (rows - 1)) * 136;
      const norm = Math.hypot((px - cx) / rx, (py - cy) / ry);
      if (norm <= 1.0) {
        const edgeFade = MathUtils.smoothstep(1.0 - norm, 0, 0.28);
        lctx.fillStyle = `rgba(255, 255, 255, ${(0.55 + 0.45 * edgeFade).toFixed(3)})`;
        lctx.beginPath();
        lctx.arc(px, py, 3.3, 0, Math.PI * 2);
        lctx.fill();
      }
    }
  }
  const ledTex = new CanvasTexture(ledCanvas);
  ledTex.colorSpace = SRGBColorSpace;

  // 2. Iconic NASA Meatball Insignia texture for the center chest badge
  const nasaCanvas = document.createElement("canvas");
  nasaCanvas.width = 256;
  nasaCanvas.height = 256;
  const nctx = nasaCanvas.getContext("2d")!;
  nctx.clearRect(0, 0, 256, 256);
  nctx.fillStyle = "#0b3d91";
  nctx.beginPath();
  nctx.arc(128, 128, 116, 0, Math.PI * 2);
  nctx.fill();
  nctx.strokeStyle = "#1e56b8";
  nctx.lineWidth = 4;
  nctx.stroke();
  nctx.fillStyle = "#ffffff";
  const stars: [number, number, number][] = [
    [62, 68, 2.5],
    [88, 52, 2],
    [172, 64, 2.8],
    [194, 86, 2],
    [74, 178, 2.5],
    [104, 194, 2],
    [168, 182, 2.5],
    [145, 75, 1.8],
    [54, 146, 2],
  ];
  for (const [sx, sy, sr] of stars) {
    nctx.beginPath();
    nctx.arc(sx, sy, sr, 0, Math.PI * 2);
    nctx.fill();
  }
  nctx.save();
  nctx.translate(128, 128);
  nctx.rotate(-0.42);
  nctx.strokeStyle = "#ffffff";
  nctx.lineWidth = 5;
  nctx.beginPath();
  nctx.ellipse(0, 0, 96, 36, 0, 0, Math.PI * 2);
  nctx.stroke();
  nctx.restore();
  nctx.strokeStyle = "#fc3d21";
  nctx.lineWidth = 14;
  nctx.lineCap = "round";
  nctx.lineJoin = "round";
  nctx.beginPath();
  nctx.moveTo(46, 172);
  nctx.lineTo(132, 66);
  nctx.lineTo(208, 152);
  nctx.stroke();
  nctx.fillStyle = "#ffffff";
  nctx.font = "900 54px system-ui, -apple-system, sans-serif";
  nctx.textAlign = "center";
  nctx.textBaseline = "middle";
  nctx.fillText("NASA", 128, 132);
  const nasaTex = new CanvasTexture(nasaCanvas);
  nasaTex.colorSpace = SRGBColorSpace;

  // 3. Blue 3x5 Photovoltaic Solar Cell Grid texture
  const solarCanvas = document.createElement("canvas");
  solarCanvas.width = 256;
  solarCanvas.height = 160;
  const sctx = solarCanvas.getContext("2d")!;
  const grad = sctx.createLinearGradient(0, 0, 256, 160);
  grad.addColorStop(0, "#2563eb");
  grad.addColorStop(0.5, "#1d4ed8");
  grad.addColorStop(1, "#1e3a8a");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 160);
  sctx.strokeStyle = "#bfdbfe";
  sctx.lineWidth = 4;
  sctx.strokeRect(4, 4, 248, 152);
  sctx.lineWidth = 2.5;
  for (let c = 1; c < 5; c++) {
    const x = (c * 256) / 5;
    sctx.beginPath();
    sctx.moveTo(x, 4);
    sctx.lineTo(x, 156);
    sctx.stroke();
  }
  for (let r = 1; r < 3; r++) {
    const y = (r * 160) / 3;
    sctx.beginPath();
    sctx.moveTo(4, y);
    sctx.lineTo(252, y);
    sctx.stroke();
  }
  const solarTex = new CanvasTexture(solarCanvas);
  solarTex.colorSpace = SRGBColorSpace;

  // 4. Crinkled metallic bump map for the gold foil chest panels
  const foilCanvas = document.createElement("canvas");
  foilCanvas.width = 128;
  foilCanvas.height = 128;
  const fctx = foilCanvas.getContext("2d")!;
  fctx.fillStyle = "#808080";
  fctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) {
    const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 128;
    const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * 128;
    const r = 8 + (i % 14);
    const g = fctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, i % 2 === 0 ? "#e5e5e5" : "#303030");
    g.addColorStop(1, i % 2 === 0 ? "#252525" : "#d8d8d8");
    fctx.fillStyle = g;
    fctx.beginPath();
    fctx.moveTo(x, y - r);
    fctx.lineTo(x + r, y);
    fctx.lineTo(x, y + r * 0.8);
    fctx.lineTo(x - r * 0.9, y + r * 0.2);
    fctx.closePath();
    fctx.fill();
  }
  const foilBump = new CanvasTexture(foilCanvas);
  foilBump.wrapS = RepeatWrapping;
  foilBump.wrapT = RepeatWrapping;

  // 5. Equirectangular studio reflection map (replaces runtime CubeCamera Environment)
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 128;
  envCanvas.height = 64;
  const ectx = envCanvas.getContext("2d")!;
  const envBg = ectx.createLinearGradient(0, 0, 0, 64);
  envBg.addColorStop(0, "#1e293b");
  envBg.addColorStop(0.5, "#0f172a");
  envBg.addColorStop(1, "#05070d");
  ectx.fillStyle = envBg;
  ectx.fillRect(0, 0, 128, 64);
  // Top softbox key lightformer
  ectx.fillStyle = "#ffffff";
  ectx.fillRect(36, 6, 56, 12);
  // Left cyan rim lightformer
  ectx.fillStyle = "#5ce1ff";
  ectx.fillRect(8, 18, 22, 18);
  // Right warm amber lightformer
  ectx.fillStyle = "#ffcf70";
  ectx.beginPath();
  ectx.arc(104, 24, 10, 0, Math.PI * 2);
  ectx.fill();
  const envTex = new CanvasTexture(envCanvas);
  envTex.mapping = EquirectangularReflectionMapping;
  envTex.colorSpace = SRGBColorSpace;

  // 6. Soft radial contact shadow texture (replaces 5-pass per-frame ContactShadows FBO)
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shctx = shadowCanvas.getContext("2d")!;
  const shGrad = shctx.createRadialGradient(64, 64, 6, 64, 64, 58);
  shGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
  shGrad.addColorStop(0.45, "rgba(0, 0, 0, 0.36)");
  shGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  shctx.fillStyle = shGrad;
  shctx.fillRect(0, 0, 128, 128);
  const shadowTex = new CanvasTexture(shadowCanvas);

  cachedMascotTextures = {
    ledTex,
    nasaTex,
    solarTex,
    foilBump,
    envTex,
    shadowTex,
  };
  return cachedMascotTextures;
}

/** Articulated tripod leg with mechanical joint rings and a chunky rounded Astro-Bot style foot-pod. */
function TripodLeg({
  hipPos,
  kneePos,
  anklePos,
  footPos,
  footRotY,
}: {
  hipPos: [number, number, number];
  kneePos: [number, number, number];
  anklePos: [number, number, number];
  footPos: [number, number, number];
  footRotY: number;
}) {
  return (
    <group>
      {/* Hip socket */}
      <mesh position={hipPos}>
        <sphereGeometry args={[0.1, 14, 10]} />
        <meshStandardMaterial color={BELLOWS_GREY} metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Upper leg strut */}
      <mesh
        position={[
          (hipPos[0] + kneePos[0]) * 0.5,
          (hipPos[1] + kneePos[1]) * 0.5,
          (hipPos[2] + kneePos[2]) * 0.5,
        ]}
        rotation={[
          (kneePos[2] - hipPos[2]) * 1.4,
          0,
          -(kneePos[0] - hipPos[0]) * 1.6,
        ]}
      >
        <cylinderGeometry args={[0.068, 0.062, 0.26, 12]} />
        <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.18} metalness={0.05} clearcoat={0.85} />
      </mesh>

      {/* Mechanical knee joint with dark pivot cap */}
      <group position={kneePos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.09, 14]} />
          <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.2} clearcoat={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.1, 12]} />
          <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Lower leg strut */}
      <mesh
        position={[
          (kneePos[0] + anklePos[0]) * 0.5,
          (kneePos[1] + anklePos[1]) * 0.5,
          (kneePos[2] + anklePos[2]) * 0.5,
        ]}
        rotation={[
          (anklePos[2] - kneePos[2]) * 1.4,
          0,
          -(anklePos[0] - kneePos[0]) * 1.6,
        ]}
      >
        <cylinderGeometry args={[0.06, 0.056, 0.22, 12]} />
        <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.18} metalness={0.05} clearcoat={0.85} />
      </mesh>

      {/* Ankle joint */}
      <group position={anklePos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.08, 12]} />
          <meshStandardMaterial color={BELLOWS_GREY} metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.09, 10]} />
          <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Chunky glossy white rounded boot-pod */}
      <group position={footPos} rotation={[0, footRotY, 0]}>
        <mesh scale={[0.92, 1.18, 1.35]}>
          <sphereGeometry args={[0.17, 16, 12]} />
          <meshPhysicalMaterial
            color={WHITE_SHELL}
            roughness={0.16}
            metalness={0.05}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Blue-grey toe band groove */}
        <mesh position={[0, -0.04, 0.05]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.145, 0.015, 8, 18]} />
          <meshStandardMaterial color="#49658c" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Front vertical telemetry vent badge on boot */}
        <RoundedBox args={[0.06, 0.11, 0.03]} radius={0.015} position={[0, 0.03, 0.21]}>
          <meshStandardMaterial color="#597399" metalness={0.6} roughness={0.3} />
        </RoundedBox>
      </group>
    </group>
  );
}

/** Ribbed accordion bellows arm segment + 4-fingered robot hand. */
function BellowsArm({
  side,
  shoulderRef,
  elbowRef,
}: {
  side: "left" | "right";
  shoulderRef?: React.RefObject<Group | null>;
  elbowRef?: React.RefObject<Group | null>;
}) {
  const isWaveArm = side === "right";
  const sign = isWaveArm ? 1 : -1;

  return (
    <group
      ref={shoulderRef}
      position={[sign * 0.45, -0.17, 0.02]}
      rotation={[0, 0, isWaveArm ? 0.55 : 0.45]}
    >
      {/* Shoulder socket ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
        <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.2} clearcoat={0.85} />
      </mesh>

      {/* Upper accordion bellows (4 ribbed rings) */}
      {[0.06, 0.12, 0.18, 0.24].map((offset, idx) => (
        <mesh
          key={idx}
          position={[sign * offset, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.088, 0.082, 0.046, 12]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? BELLOWS_GREY : "#7e8a9b"}
            metalness={0.45}
            roughness={0.38}
          />
        </mesh>
      ))}

      {/* Forearm pivot (curves up for waving arm, down for resting arm) */}
      <group
        ref={elbowRef}
        position={[sign * 0.27, 0, 0]}
        rotation={[0, 0, isWaveArm ? 0.72 : -0.85]}
      >
        {[0.04, 0.1, 0.16, 0.22].map((offset, idx) => (
          <mesh
            key={idx}
            position={[sign * offset, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.084, 0.08, 0.045, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? BELLOWS_GREY : "#7e8a9b"}
              metalness={0.45}
              roughness={0.38}
            />
          </mesh>
        ))}

        {/* Glossy white rounded palm + cuff */}
        <group position={[sign * 0.33, 0, 0]} rotation={[0, 0, isWaveArm ? -0.35 : 0.2]}>
          {/* Blue-grey wrist ring */}
          <mesh position={[-sign * 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.095, 0.095, 0.025, 14]} />
            <meshStandardMaterial color="#49658c" metalness={0.55} roughness={0.3} />
          </mesh>

          {/* Rounded white hand palm */}
          <mesh scale={[1.05, 0.95, 0.78]}>
            <sphereGeometry args={[0.115, 14, 10]} />
            <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.18} clearcoat={0.9} />
          </mesh>

          {/* 4 articulated robot fingers */}
          {[-0.38, -0.12, 0.14, 0.4].map((angle, fIdx) => (
            <group
              key={fIdx}
              position={[
                sign * 0.095 * Math.cos(angle),
                0.085 * Math.sin(angle) + (isWaveArm ? 0.02 : -0.02),
                0,
              ]}
              rotation={[0, 0, sign * angle * 0.65]}
            >
              <mesh position={[sign * 0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.022, 0.045, 4, 8]} />
                <meshStandardMaterial color={BELLOWS_GREY} metalness={0.45} roughness={0.35} />
              </mesh>
            </group>
          ))}

          {/* Thumb */}
          <group
            position={[sign * 0.02, isWaveArm ? 0.095 : -0.095, 0.03]}
            rotation={[0.2, 0, isWaveArm ? sign * 0.75 : -sign * 0.75]}
          >
            <mesh position={[sign * 0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.024, 0.038, 4, 8]} />
              <meshStandardMaterial color={BELLOWS_GREY} metalness={0.45} roughness={0.35} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function SurveyorHost3D({
  mood,
  isSpeaking,
  accent,
  reduceMotion,
}: SurveyorHostProps) {
  const spec = LORO_MOODS[mood];
  const { gl, scene } = useThree();
  const { ledTex, nasaTex, solarTex, foilBump, envTex, shadowTex } =
    getMascotTextures();

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
  const dishGroup = useRef<Group>(null);
  const solarGroup = useRef<Group>(null);
  const ledMats = useRef<MeshBasicMaterial[]>([]);
  const glowMats = useRef<MeshBasicMaterial[]>([]);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const blink = useRef({ next: 1.8, t: -1 });
  const targetColor = useMemo(() => new Color(), []);

  // Track cursor across the viewport without triggering synchronous layout reflows on every move
  useEffect(() => {
    let cachedRect = gl.domElement.getBoundingClientRect();
    let winW = window.innerWidth;
    let winH = window.innerHeight;

    const refreshBounds = () => {
      cachedRect = gl.domElement.getBoundingClientRect();
      winW = window.innerWidth;
      winH = window.innerHeight;
    };

    const onMove = (e: PointerEvent) => {
      if (cachedRect.width === 0) refreshBounds();
      const cx = cachedRect.left + cachedRect.width / 2;
      const cy = cachedRect.top + cachedRect.height * 0.44;
      const dx = e.clientX - cx;
      const dy = cy - e.clientY;
      const zDepth = Math.min(winW, winH) * 0.22;
      const len = Math.hypot(dx, dy, zDepth) || 1;
      pointer.current.x = MathUtils.clamp(dx / len, -1, 1);
      pointer.current.y = MathUtils.clamp(dy / len, -1, 1);
      pointer.current.active = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", refreshBounds, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", refreshBounds);
    };
  }, [gl]);

  const registerLedMat = (m: MeshBasicMaterial | null) => {
    if (m && !ledMats.current.includes(m)) {
      ledMats.current.push(m);
    }
  };

  const registerGlowMat = (m: MeshBasicMaterial | null) => {
    if (m && !glowMats.current.includes(m)) {
      glowMats.current.push(m);
    }
  };

  const activeColorHex = mood === "nostalgic" ? "#ffcf70" : accent || spec.irisColor;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const k = (rate: number) => 1 - Math.exp(-rate * d);

    // Smoothly transition LED eye & mouth color based on mood/speaker
    targetColor.set(activeColorHex);
    for (const m of ledMats.current) {
      m.color.lerp(targetColor, k(8));
    }
    for (const m of glowMats.current) {
      m.color.lerp(targetColor, k(8));
    }

    // Gaze direction
    let gx = pointer.current.x;
    let gy = pointer.current.y;
    if (!pointer.current.active) {
      if (mood === "scanning") {
        gx = Math.sin(t * 1.5) * 0.85;
        gy = -0.15;
      } else if (mood === "nostalgic") {
        gx = 0.2;
        gy = 0.35;
      } else {
        const phase = Math.floor(t / 2.8);
        gx = phase % 3 === 0 ? 0.18 : 0.18 + Math.sin(phase * 12.9898) * 0.32;
        gy = phase % 3 === 0 ? 0.1 : 0.1 + Math.cos(phase * 4.1414) * 0.2;
      }
    }
    if (reduceMotion) {
      gx *= 0.35;
      gy *= 0.35;
    }

    // Translate LED eyes & smile across the visor for expressive 2.5D parallax
    if (faceGroup.current) {
      faceGroup.current.position.x = MathUtils.lerp(faceGroup.current.position.x, gx * 0.085, k(16));
      faceGroup.current.position.y = MathUtils.lerp(faceGroup.current.position.y, gy * 0.065, k(16));
    }

    // Rotate helmet toward pointer + friendly head tilt
    if (head.current) {
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, gx * 0.55, k(8));
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, -gy * 0.38, k(8));
      const tilt =
        MathUtils.degToRad(spec.bodyTiltDeg * 0.85) -
        gx * 0.08 +
        (isSpeaking && !reduceMotion ? Math.sin(t * 2.6) * 0.045 : -0.05);
      head.current.rotation.z = MathUtils.lerp(head.current.rotation.z, tilt, k(6));
    }

    // Blinking & mood eye scale
    const b = blink.current;
    if (b.t < 0 && t > b.next) b.t = 0;
    let blinkAmt = 0;
    if (b.t >= 0) {
      b.t += d;
      const p = b.t / 0.15;
      blinkAmt = p < 1 ? Math.sin(p * Math.PI) : 0;
      if (p >= 1) {
        b.t = -1;
        b.next = t + 2.2 + Math.random() * 3.4;
      }
    }
    const baseScaleY =
      mood === "excited" ? 1.12 : mood === "nostalgic" ? 0.78 : mood === "scanning" ? 0.86 : 1.0;
    const eyeScaleY = Math.max(0.06, baseScaleY * (1 - blinkAmt * 0.94));
    const eyeScaleX = mood === "excited" ? 1.08 : 1.0 + blinkAmt * 0.12;
    for (const eyeRef of [eyeLeft, eyeRight]) {
      if (!eyeRef.current) continue;
      eyeRef.current.scale.y = MathUtils.lerp(eyeRef.current.scale.y, eyeScaleY, k(blinkAmt > 0 ? 38 : 12));
      eyeRef.current.scale.x = MathUtils.lerp(eyeRef.current.scale.x, eyeScaleX, k(14));
    }

    // Curved LED smile mouth animation (pulses cheerfully when speaking)
    if (mouthGroup.current) {
      const talkBounce = isSpeaking
        ? 0.9 + Math.abs(Math.sin(t * 14) * 0.65 + Math.cos(t * 8.5) * 0.45)
        : mood === "excited" || mood === "waving"
          ? 1.15
          : 1.0;
      const talkWidth = isSpeaking
        ? 1.0 + Math.sin(t * 11) * 0.12
        : mood === "excited"
          ? 1.15
          : 1.0;
      mouthGroup.current.scale.y = MathUtils.lerp(mouthGroup.current.scale.y, talkBounce, k(20));
      mouthGroup.current.scale.x = MathUtils.lerp(mouthGroup.current.scale.x, talkWidth, k(14));
    }

    // Whole-body hover bob & gentle turn
    if (root.current) {
      const bobAmp = reduceMotion ? 0 : mood === "excited" ? 0.055 : 0.022;
      const bobRate = mood === "excited" ? 5.2 : 1.8;
      const bob =
        mood === "excited" ? Math.abs(Math.sin(t * bobRate)) * bobAmp : Math.sin(t * bobRate) * bobAmp;
      root.current.position.y = -0.05 + bob;
      const sway = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.04;
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, gx * 0.32 + sway, k(5));
      root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, -gy * 0.12, k(5));
    }

    // Waving right accordion arm
    if (waveShoulder.current && waveElbow.current) {
      const activeWave = !reduceMotion && (mood === "waving" || mood === "excited" || isSpeaking);
      const shoulderTarget = activeWave ? 0.48 : 0.25;
      const waveOsc = activeWave
        ? Math.sin(t * (mood === "excited" ? 8.5 : 5.6)) * 0.32
        : Math.sin(t * 1.4) * 0.06;
      waveShoulder.current.rotation.z = MathUtils.lerp(
        waveShoulder.current.rotation.z,
        shoulderTarget + waveOsc * 0.35,
        k(7),
      );
      waveElbow.current.rotation.z = MathUtils.lerp(
        waveElbow.current.rotation.z,
        0.78 + waveOsc,
        k(11),
      );
    }

    if (restShoulder.current && !reduceMotion) {
      restShoulder.current.rotation.z = MathUtils.lerp(
        restShoulder.current.rotation.z,
        0.45 + Math.sin(t * 1.6 + 1.2) * 0.04,
        k(6),
      );
    }

    // Dish & solar panel subtle tracking motion
    if (dishGroup.current && !reduceMotion) {
      dishGroup.current.rotation.y = MathUtils.lerp(
        dishGroup.current.rotation.y,
        -0.25 + gx * 0.35 + Math.sin(t * 1.1) * 0.12,
        k(6),
      );
    }
    if (solarGroup.current && !reduceMotion) {
      solarGroup.current.rotation.z = MathUtils.lerp(
        solarGroup.current.rotation.z,
        0.38 + Math.sin(t * 0.9) * 0.04,
        k(5),
      );
    }
  });

  return (
    <>
      <hemisphereLight args={["#e8f1ff", "#1a2436", 1.05]} />
      <directionalLight position={[3.5, 5.5, 4.5]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[-4, 2.5, -2]} intensity={1.35} color={activeColorHex} />
      <pointLight position={[0, 0.5, 2.4]} intensity={1.4} distance={5} color="#a5f3fc" />

      {/* Subtle ambient star-dust sparkles behind the mascot (matching Option 3) */}
      {!reduceMotion && (
        <Sparkles
          count={26}
          scale={[3.4, 3.0, 1.6]}
          position={[0, 0.25, -0.9]}
          size={1.6}
          speed={0.25}
          opacity={0.65}
          color="#7ce8ff"
        />
      )}

      <group ref={root} position={[0, -0.05, 0]}>
        {/* ================================================================ */}
        {/* HEAD — Glossy White Astronaut Helmet + Visor + Solar & Dish Hat   */}
        {/* ================================================================ */}
        <group ref={head} position={[0, 0.56, 0]}>
          {/* Outer glossy white rounded helmet shell */}
          <mesh scale={[1.1, 0.93, 0.96]}>
            <sphereGeometry args={[0.56, 28, 20]} />
            <meshPhysicalMaterial
              color={WHITE_SHELL}
              roughness={0.15}
              metalness={0.04}
              clearcoat={0.95}
              clearcoatRoughness={0.08}
            />
          </mesh>

          {/* Recessed visor bezel rim */}
          <RoundedBox
            args={[0.92, 0.56, 0.24]}
            radius={0.26}
            smoothness={4}
            position={[0, -0.01, 0.36]}
          >
            <meshPhysicalMaterial color="#dce4f0" roughness={0.22} metalness={0.1} clearcoat={0.8} />
          </RoundedBox>

          {/* Deep dark glossy glass visor */}
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

          {/* Subtle glass reflection highlight on upper-right of visor */}
          <mesh position={[0.16, 0.12, 0.502]} rotation={[0, 0, -0.22]}>
            <planeGeometry args={[0.24, 0.07]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.11} />
          </mesh>

          {/* Expressive LED-Matrix Cyan Eyes & Curved Smile inside the visor */}
          <group ref={faceGroup} position={[0, -0.01, 0.506]}>
            {/* Left Oval LED Eye */}
            <group ref={eyeLeft} position={[-0.19, 0.035, 0]}>
              <mesh scale={[1, 1.28, 1]}>
                <circleGeometry args={[0.105, 20]} />
                <meshBasicMaterial ref={registerGlowMat} color={activeColorHex} transparent opacity={0.22} />
              </mesh>
              <mesh position={[0, 0, 0.004]}>
                <planeGeometry args={[0.18, 0.23]} />
                <meshBasicMaterial
                  ref={registerLedMat}
                  map={ledTex}
                  color={activeColorHex}
                  transparent
                  toneMapped={false}
                />
              </mesh>
            </group>

            {/* Right Oval LED Eye */}
            <group ref={eyeRight} position={[0.19, 0.035, 0]}>
              <mesh scale={[1, 1.28, 1]}>
                <circleGeometry args={[0.105, 20]} />
                <meshBasicMaterial ref={registerGlowMat} color={activeColorHex} transparent opacity={0.22} />
              </mesh>
              <mesh position={[0, 0, 0.004]}>
                <planeGeometry args={[0.18, 0.23]} />
                <meshBasicMaterial
                  ref={registerLedMat}
                  map={ledTex}
                  color={activeColorHex}
                  transparent
                  toneMapped={false}
                />
              </mesh>
            </group>

            {/* Cute Curved LED Smile Mouth (between & slightly below the eyes) */}
            <group ref={mouthGroup} position={[0, -0.09, 0.005]}>
              <mesh rotation={[0, 0, Math.PI * 1.18]}>
                <torusGeometry args={[0.062, 0.014, 8, 18, Math.PI * 0.64]} />
                <meshBasicMaterial ref={registerLedMat} color={activeColorHex} toneMapped={false} />
              </mesh>
              {/* Soft glow halo behind the smile */}
              <mesh position={[0, -0.04, -0.002]} scale={[1.4, 0.7, 1]}>
                <circleGeometry args={[0.055, 16]} />
                <meshBasicMaterial ref={registerGlowMat} color={activeColorHex} transparent opacity={0.2} />
              </mesh>
            </group>
          </group>

          {/* -------------------------------------------------------------- */}
          {/* TOP-LEFT HAT: Tilted Blue 3x5 Photovoltaic Solar Panel         */}
          {/* -------------------------------------------------------------- */}
          <group ref={solarGroup} position={[-0.28, 0.5, 0.02]} rotation={[0.28, 0.18, 0.38]}>
            {/* Pivot stem */}
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.12, 12]} />
              <meshStandardMaterial color={BELLOWS_GREY} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Solar panel frame */}
            <RoundedBox args={[0.56, 0.026, 0.34]} radius={0.01} position={[-0.06, 0.03, 0]}>
              <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
            </RoundedBox>
            {/* 3x5 gridded blue photovoltaic surface */}
            <mesh position={[-0.06, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.53, 0.31]} />
              <meshStandardMaterial
                map={solarTex}
                roughness={0.2}
                metalness={0.35}
                emissive="#1e3a8a"
                emissiveIntensity={0.25}
              />
            </mesh>
          </group>

          {/* -------------------------------------------------------------- */}
          {/* TOP-RIGHT HAT: White Parabolic High-Gain Dish Antenna          */}
          {/* -------------------------------------------------------------- */}
          <group ref={dishGroup} position={[0.27, 0.5, 0.0]} rotation={[0.32, -0.25, -0.45]}>
            {/* Pivot stem */}
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.12, 12]} />
              <meshStandardMaterial color={BELLOWS_GREY} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Parabolic dish bowl */}
            <mesh position={[0, 0.02, 0]} scale={[1, 0.38, 1]}>
              <sphereGeometry args={[0.25, 20, 12, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52]} />
              <meshPhysicalMaterial
                color={WHITE_SHELL}
                roughness={0.2}
                metalness={0.08}
                clearcoat={0.85}
                side={DoubleSide}
              />
            </mesh>
            {/* Dish rim torus */}
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.25, 0.016, 8, 20]} />
              <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.2} clearcoat={0.85} />
            </mesh>
            {/* Central feed horn spike + ball tip */}
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.01, 0.022, 0.2, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.19, 0]}>
              <sphereGeometry args={[0.026, 12, 8]} />
              <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.18} clearcoat={0.9} />
            </mesh>
          </group>
        </group>

        {/* ================================================================ */}
        {/* NECK COLLAR RING                                                 */}
        {/* ================================================================ */}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.028, 10, 24]} />
          <meshStandardMaterial color={BELLOWS_GREY} metalness={0.55} roughness={0.32} />
        </mesh>

        {/* ================================================================ */}
        {/* TORSO — Glossy White Suit + Crinkled Gold Foil + NASA Badge      */}
        {/* ================================================================ */}
        <group position={[0, -0.24, 0]}>
          {/* Main rounded cylindrical space-suit body */}
          <RoundedBox args={[0.88, 0.52, 0.68]} radius={0.18} smoothness={4}>
            <meshPhysicalMaterial
              color={WHITE_SHELL}
              roughness={0.16}
              metalness={0.05}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
            />
          </RoundedBox>

          {/* Left & Right Crinkled Gold Thermal Foil Chest Panels */}
          <RoundedBox
            args={[0.25, 0.27, 0.06]}
            radius={0.025}
            position={[-0.24, 0.01, 0.325]}
            rotation={[0, -0.18, 0]}
          >
            <meshStandardMaterial
              color={GOLD_FOIL}
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
              color={GOLD_FOIL}
              metalness={0.92}
              roughness={0.26}
              bumpMap={foilBump}
              bumpScale={0.025}
            />
          </RoundedBox>

          {/* Center Raised White Chest Plate + NASA Meatball Emblem */}
          <group position={[0, 0.04, 0.35]}>
            <RoundedBox args={[0.25, 0.23, 0.055]} radius={0.035} smoothness={4}>
              <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.18} clearcoat={0.9} />
            </RoundedBox>
            <mesh position={[0, 0, 0.029]}>
              <circleGeometry args={[0.088, 24]} />
              <meshStandardMaterial map={nasaTex} roughness={0.25} metalness={0.05} />
            </mesh>
          </group>

          {/* Four Silver Socket Bolts Flanking the Chest Plate */}
          {(
            [
              [-0.145, 0.125],
              [0.145, 0.125],
              [-0.145, -0.135],
              [0.145, -0.135],
            ] as const
          ).map(([bx, by], idx) => (
            <group key={idx} position={[bx, by, 0.342]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.02, 10]} />
                <meshStandardMaterial color={BELLOWS_GREY} metalness={0.75} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.011, 0.011, 0.015, 8]} />
                <meshStandardMaterial color={DARK_METAL} metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Lower Gold Telemetry Indicator Slot Plate */}
          <RoundedBox args={[0.14, 0.055, 0.03]} radius={0.01} position={[0, -0.135, 0.34]}>
            <meshStandardMaterial
              color={GOLD_FOIL}
              metalness={0.9}
              roughness={0.28}
              bumpMap={foilBump}
              bumpScale={0.015}
            />
          </RoundedBox>

          {/* Life-Support / Telemetry Backpack */}
          <group position={[-0.04, 0.02, -0.36]}>
            <RoundedBox args={[0.52, 0.38, 0.18]} radius={0.06}>
              <meshPhysicalMaterial color={WHITE_SHELL} roughness={0.2} clearcoat={0.85} />
            </RoundedBox>
            {/* Glowing cyan side telemetry port on backpack */}
            <mesh position={[-0.265, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
              <meshBasicMaterial ref={registerLedMat} color={activeColorHex} />
            </mesh>
          </group>
        </group>

        {/* ================================================================ */}
        {/* SEGMENTED ACCORDION BELLOWS ARMS + 4-FINGERED HANDS              */}
        {/* ================================================================ */}
        <BellowsArm side="left" shoulderRef={restShoulder} />
        <BellowsArm side="right" shoulderRef={waveShoulder} elbowRef={waveElbow} />

        {/* ================================================================ */}
        {/* THREE ARTICULATED TRIPOD LEGS + CHUNKY ROUNDED BOOT-PODS         */}
        {/* ================================================================ */}
        {/* Left Splayed Leg */}
        <TripodLeg
          hipPos={[-0.26, -0.5, -0.02]}
          kneePos={[-0.38, -0.66, 0.02]}
          anklePos={[-0.48, -0.8, 0.05]}
          footPos={[-0.56, -0.84, 0.09]}
          footRotY={-0.45}
        />

        {/* Right Splayed Leg */}
        <TripodLeg
          hipPos={[0.26, -0.5, -0.02]}
          kneePos={[0.38, -0.66, 0.02]}
          anklePos={[0.48, -0.8, 0.05]}
          footPos={[0.56, -0.84, 0.09]}
          footRotY={0.45}
        />

        {/* Center-Front Stepping Leg */}
        <TripodLeg
          hipPos={[0.02, -0.5, 0.14]}
          kneePos={[0.05, -0.68, 0.22]}
          anklePos={[0.08, -0.82, 0.28]}
          footPos={[0.1, -0.88, 0.36]}
          footRotY={0.08}
        />
      </group>

      <mesh position={[0, -1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
