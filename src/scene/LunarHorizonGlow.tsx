import { useMemo } from "react";
import { AdditiveBlending, BackSide, ShaderMaterial } from "three";
import { useAppStore } from "@/store/useAppStore";

export default function LunarHorizonGlow() {
  const body = useAppStore((s) => s.celestialBody);

  const limbMaterial = useMemo(() => {
    const isMars = body === "mars";
    return new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormalView;
        void main() {
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: isMars
        ? /* glsl */ `
          varying vec3 vNormalView;
          void main() {
            float rim = pow(max(0.0, 0.62 - dot(vNormalView, vec3(0.0, 0.0, 1.0))), 3.0);
            vec3 dustyAmber = vec3(0.95, 0.56, 0.34);
            vec3 upperRayleigh = vec3(0.55, 0.72, 0.96);
            vec3 col = mix(dustyAmber, upperRayleigh, smoothstep(0.05, 0.32, rim));
            gl_FragColor = vec4(col, rim * 0.34);
          }
        `
        : /* glsl */ `
          varying vec3 vNormalView;
          void main() {
            float rim = pow(max(0.0, 0.58 - dot(vNormalView, vec3(0.0, 0.0, 1.0))), 3.4);
            gl_FragColor = vec4(0.75, 0.85, 1.0, rim * 0.24);
          }
        `,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    });
  }, [body]);

  return (
    <mesh name="planetary-limb-glow" material={limbMaterial}>
      <sphereGeometry args={[body === "mars" ? 1.022 : 1.018, 64, 64]} />
    </mesh>
  );
}
