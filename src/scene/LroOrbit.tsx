import { useMemo, useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Group, Vector3 } from "three";
import { useAppStore } from "@/store/useAppStore";

const ORBIT_RADIUS = 1.035; // ~60 km polar reconnaissance orbit
const ORBIT_INCLINATION_RAD = (86 * Math.PI) / 180;

export default function LroOrbit() {
  const satelliteRef = useRef<Group>(null);
  const loroMood = useAppStore((s) => s.loroMood);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const orbitPoints = useMemo(() => {
    const pts: Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new Vector3(Math.cos(t) * ORBIT_RADIUS, Math.sin(t) * ORBIT_RADIUS, 0));
    }
    return pts;
  }, []);

  const angleRef = useRef(0.55);

  useFrame((_, delta) => {
    if (!satelliteRef.current) return;
    if (!reduceMotion) {
      angleRef.current += delta * 0.14;
    }
    const a = angleRef.current;
    const x = Math.cos(a) * ORBIT_RADIUS;
    const y = Math.sin(a) * ORBIT_RADIUS;
    satelliteRef.current.position.set(x, y, 0);
    satelliteRef.current.lookAt(0, 0, 0);
  });

  const isScanning = loroMood === "scanning";

  return (
    <group
      name="lro-polar-orbit"
      rotation={[ORBIT_INCLINATION_RAD - Math.PI / 2, 0.42, 0.18]}
    >
      <Line
        points={orbitPoints}
        color="#5ce1ff"
        lineWidth={1}
        transparent
        opacity={isScanning ? 0.34 : 0.14}
      />

      <group ref={satelliteRef} position={[ORBIT_RADIUS, 0, 0]}>
        {/* Lo-Ro orbital beacon core */}
        <mesh>
          <sphereGeometry args={[0.0085, 16, 16]} />
          <meshBasicMaterial color="#ffcf70" toneMapped={false} />
        </mesh>

        {/* Cyan halo */}
        <mesh>
          <sphereGeometry args={[0.016, 16, 16]} />
          <meshBasicMaterial
            color="#5ce1ff"
            transparent
            opacity={0.45}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Downward LROC laser/camera scan cone toward the lunar surface */}
        <mesh position={[0, 0, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[isScanning ? 0.022 : 0.011, 0.036, 20, 1, true]} />
          <meshBasicMaterial
            color="#5ce1ff"
            transparent
            opacity={isScanning ? 0.32 : 0.1}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
