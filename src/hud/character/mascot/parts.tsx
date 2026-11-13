import type { RefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import type { Group, MeshBasicMaterial, Texture } from "three";

export const DEFAULT_SHELL = "#f2f6fc";
export const DEFAULT_BELLOWS = "#9ba6b5";
export const DEFAULT_DARK = "#1a2232";
export const DEFAULT_TRIM = "#49658c";

/**
 * Shared cartoon parts used by every mascot host so the whole cast reads as one
 * friendly family: articulated tripod legs, accordion bellows arms, and the
 * glowing LED-matrix face.
 */

interface MascotColors {
  shell?: string;
  bellows?: string;
  dark?: string;
  trim?: string;
}

export function TripodLeg({
  hipPos,
  kneePos,
  anklePos,
  footPos,
  footRotY,
  shell = DEFAULT_SHELL,
  bellows = DEFAULT_BELLOWS,
  dark = DEFAULT_DARK,
  trim = DEFAULT_TRIM,
}: MascotColors & {
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
        <meshStandardMaterial color={bellows} metalness={0.55} roughness={0.35} />
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
        <meshPhysicalMaterial color={shell} roughness={0.18} metalness={0.05} clearcoat={0.85} />
      </mesh>

      {/* Mechanical knee joint with dark pivot cap */}
      <group position={kneePos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.09, 14]} />
          <meshPhysicalMaterial color={shell} roughness={0.2} clearcoat={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.1, 12]} />
          <meshStandardMaterial color={dark} metalness={0.7} roughness={0.3} />
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
        <meshPhysicalMaterial color={shell} roughness={0.18} metalness={0.05} clearcoat={0.85} />
      </mesh>

      {/* Ankle joint */}
      <group position={anklePos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.08, 12]} />
          <meshStandardMaterial color={bellows} metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.09, 10]} />
          <meshStandardMaterial color={dark} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Chunky glossy rounded boot-pod */}
      <group position={footPos} rotation={[0, footRotY, 0]}>
        <mesh scale={[0.92, 1.18, 1.35]}>
          <sphereGeometry args={[0.17, 16, 12]} />
          <meshPhysicalMaterial
            color={shell}
            roughness={0.16}
            metalness={0.05}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Toe band groove */}
        <mesh position={[0, -0.04, 0.05]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.145, 0.015, 8, 18]} />
          <meshStandardMaterial color={trim} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Front telemetry vent badge on boot */}
        <RoundedBox args={[0.06, 0.11, 0.03]} radius={0.015} position={[0, 0.03, 0.21]}>
          <meshStandardMaterial color={trim} metalness={0.6} roughness={0.3} />
        </RoundedBox>
      </group>
    </group>
  );
}

/** Ribbed accordion bellows arm + 4-fingered mitten hand. */
export function BellowsArm({
  side,
  shoulderRef,
  elbowRef,
  shell = DEFAULT_SHELL,
  bellows = DEFAULT_BELLOWS,
  trim = DEFAULT_TRIM,
  accessory,
}: MascotColors & {
  side: "left" | "right";
  shoulderRef?: RefObject<Group | null>;
  elbowRef?: RefObject<Group | null>;
  /** Optional cartoon tool held instead of the plain mitten (Surveyor 7's soil scoop). */
  accessory?: "scoop" | null;
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
        <meshPhysicalMaterial color={shell} roughness={0.2} clearcoat={0.85} />
      </mesh>

      {/* Upper accordion bellows (4 ribbed rings) */}
      {[0.06, 0.12, 0.18, 0.24].map((offset, idx) => (
        <mesh key={idx} position={[sign * offset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.088, 0.082, 0.046, 12]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? bellows : "#7e8a9b"}
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
          <mesh key={idx} position={[sign * offset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.084, 0.08, 0.045, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? bellows : "#7e8a9b"}
              metalness={0.45}
              roughness={0.38}
            />
          </mesh>
        ))}

        {/* Glossy rounded palm + cuff */}
        <group position={[sign * 0.33, 0, 0]} rotation={[0, 0, isWaveArm ? -0.35 : 0.2]}>
          {/* Wrist ring */}
          <mesh position={[-sign * 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.095, 0.095, 0.025, 14]} />
            <meshStandardMaterial color={trim} metalness={0.55} roughness={0.3} />
          </mesh>

          {/* Rounded palm */}
          <mesh scale={[1.05, 0.95, 0.78]}>
            <sphereGeometry args={[0.115, 14, 10]} />
            <meshPhysicalMaterial color={shell} roughness={0.18} clearcoat={0.9} />
          </mesh>

          {accessory === "scoop" ? (
            /* Surveyor 7's little articulated soil scoop, held in front of the mitten */
            <group position={[sign * 0.02, -0.01, 0.12]} rotation={[-0.35, 0, sign * -0.15]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
                <meshStandardMaterial color={bellows} metalness={0.6} roughness={0.3} />
              </mesh>
              <group position={[0, 0.01, 0.11]}>
                {/* Scoop bowl */}
                <mesh scale={[1.15, 0.55, 0.95]}>
                  <sphereGeometry args={[0.105, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial
                    color="#c8d2e0"
                    metalness={0.85}
                    roughness={0.22}
                    side={DoubleSide}
                  />
                </mesh>
                {/* Dark rim so the scoop reads at small sizes */}
                <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.108, 0.011, 6, 18]} />
                  <meshStandardMaterial color={bellows} metalness={0.7} roughness={0.3} />
                </mesh>
                {/* A friendly little mound of lunar soil inside */}
                <mesh position={[0, 0.014, 0]} scale={[1.05, 0.42, 0.85]}>
                  <sphereGeometry args={[0.08, 12, 8]} />
                  <meshStandardMaterial color="#8b8578" roughness={0.95} metalness={0} />
                </mesh>
              </group>
            </group>
          ) : (
            <>
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
                    <meshStandardMaterial color={bellows} metalness={0.45} roughness={0.35} />
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
                  <meshStandardMaterial color={bellows} metalness={0.45} roughness={0.35} />
                </mesh>
              </group>
            </>
          )}
        </group>
      </group>
    </group>
  );
}

/**
 * The friendly LED-matrix face: two glowing pixel eyes, a curved smile, and soft
 * halo glows. Animation (gaze, blink, talk) is driven by the parent's useFrame.
 */
export function MascotFace({
  ledTex,
  accent,
  faceRef,
  eyeLeftRef,
  eyeRightRef,
  mouthRef,
  onLedMat,
  onGlowMat,
  eyeSpacing = 0.19,
  eyeSize = 1,
  mouthY = -0.09,
  glowStrength = 0.22,
  position = [0, -0.01, 0.528],
}: {
  ledTex: Texture;
  accent: string;
  faceRef?: RefObject<Group | null>;
  eyeLeftRef?: RefObject<Group | null>;
  eyeRightRef?: RefObject<Group | null>;
  mouthRef?: RefObject<Group | null>;
  onLedMat?: (m: MeshBasicMaterial | null) => void;
  onGlowMat?: (m: MeshBasicMaterial | null) => void;
  eyeSpacing?: number;
  eyeSize?: number;
  mouthY?: number;
  glowStrength?: number;
  position?: [number, number, number];
}) {
  return (
    <group ref={faceRef} position={position}>
      {(
        [
          [-eyeSpacing, eyeLeftRef],
          [eyeSpacing, eyeRightRef],
        ] as const
      ).map(([x, ref], idx) => (
        <group key={idx} ref={ref} position={[x, 0.035, 0]}>
          <mesh scale={[1, 1.28, 1]}>
            <circleGeometry args={[0.105, 20]} />
            <meshBasicMaterial
              ref={onGlowMat}
              color={accent}
              transparent
              opacity={glowStrength}
            />
          </mesh>
          <mesh position={[0, 0, 0.004]} scale={[eyeSize, eyeSize, 1]}>
            <planeGeometry args={[0.18, 0.23]} />
            <meshBasicMaterial
              ref={onLedMat}
              map={ledTex}
              color={accent}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Cute curved LED smile */}
      <group ref={mouthRef} position={[0, mouthY, 0.005]}>
        <mesh rotation={[0, 0, Math.PI * 1.18]}>
          <torusGeometry args={[0.062, 0.014, 8, 18, Math.PI * 0.64]} />
          <meshBasicMaterial
            ref={onLedMat}
            color={accent}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.04, -0.002]} scale={[1.4, 0.7, 1]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial
            ref={onGlowMat}
            color={accent}
            transparent
            opacity={glowStrength * 0.9}
          />
        </mesh>
      </group>
    </group>
  );
}
