import { useMemo } from "react";
import { AdditiveBlending, BackSide, ShaderMaterial } from "three";

export default function LunarHorizonGlow() {
  const limbMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormalView;
        void main() {
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
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
  }, []);

  return (
    <mesh name="lunar-exosphere-glow" material={limbMaterial}>
      <sphereGeometry args={[1.018, 64, 64]} />
    </mesh>
  );
}
