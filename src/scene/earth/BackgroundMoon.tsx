import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
} from "three";
import { latLonToVector3, normalizeLon } from "@/lib/geo";
import { disposeTexture, loadTextureAsync } from "@/lib/textureLoader";
import { useAppStore } from "@/store/useAppStore";

const MOON_DISTANCE = 13.5;
const MOON_RADIUS = 0.58;
const MOON_POS = latLonToVector3(-6, 112, MOON_DISTANCE);
const NOOP_RAYCAST = () => {};

const MOON_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;
  varying vec3 vSpherePos;

  void main() {
    vUv = uv;
    vSpherePos = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const MOON_FRAGMENT = /* glsl */ `
  uniform sampler2D uMoonMap;
  uniform float uHasTexture;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;
  varying vec3 vSpherePos;

  float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float regolithNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash31(i + vec3(0, 0, 0)), hash31(i + vec3(1, 0, 0)), u.x),
        mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), u.x),
        u.y
      ),
      mix(
        mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), u.x),
        mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), u.x),
        u.y
      ),
      u.z
    );
  }

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    // Subtle procedural micro-relief so terminator craters look crisp even from afar
    float micro = regolithNoise(vSpherePos * 42.0) - 0.5;
    vec3 Npert = normalize(N + vSpherePos * (micro * 0.08));

    float mu0 = max(0.0, dot(Npert, L));
    float mu = max(0.0, dot(Npert, V));
    float rawSun = dot(N, L);

    vec3 sampleCol = uHasTexture > 0.5
      ? texture2D(uMoonMap, vUv).rgb
      : vec3(0.68, 0.66, 0.62);

    // Enrich mare vs highland contrast slightly for deep-space clarity
    vec3 albedo = pow(sampleCol, vec3(1.04)) * vec3(1.06, 1.04, 1.00);

    // Lommel-Seeliger lunar regolith reflectance + opposition surge
    float lommel = mu0 / max(0.001, mu0 + mu * 0.65);
    float cosPhase = clamp(dot(L, V), -1.0, 1.0);
    float oppositionSurge = 1.0 + 0.28 * pow(max(0.0, 0.5 + 0.5 * cosPhase), 3.0);
    float terminatorSoft = smoothstep(-0.08, 0.14, rawSun);

    float dayLit = mix(lommel * 0.78, pow(mu0, 0.68), 0.35) * oppositionSurge * terminatorSoft;

    // Subtle bluish Earthshine on the unlit lunar hemisphere facing Earth
    vec3 toEarth = normalize(-vWorldPos);
    float earthFacing = max(0.0, dot(N, toEarth));
    vec3 earthshine = albedo * vec3(0.55, 0.72, 1.0) * (0.045 + 0.055 * earthFacing);

    vec3 dayColor = albedo * dayLit * 1.18;
    vec3 finalColor = earthshine * (1.0 - terminatorSoft * 0.75) + dayColor;

    gl_FragColor = vec4(finalColor, 1.0);
    #include <colorspace_fragment>
  }
`;

const HALO_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vNormalView;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vNormalWorld;
  varying vec3 vNormalView;

  void main() {
    float viewZ = clamp(-vNormalView.z, 0.0, 1.0);
    float rim = pow(smoothstep(0.0, 0.40, viewZ), 2.6);

    vec3 N = normalize(-vNormalWorld);
    float sunFacing = smoothstep(-0.25, 0.45, dot(N, normalize(uSunDir)));

    vec3 glowColor = mix(vec3(0.55, 0.68, 0.90), vec3(0.95, 0.93, 0.88), sunFacing);
    float alpha = rim * (0.12 + 0.88 * sunFacing) * 0.32;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export default function BackgroundMoon() {
  const { gl } = useThree();
  const groupRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);

  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const curLonRef = useRef(sunLongitude);
  const curLatRef = useRef(sunLatitude);
  const sunVecRef = useRef(
    latLonToVector3(sunLatitude, sunLongitude, 1).normalize(),
  );

  const moonMaterial = useMemo(() => {
    const initialSun = latLonToVector3(sunLatitude, sunLongitude, 1).normalize();
    return new ShaderMaterial({
      vertexShader: MOON_VERTEX,
      fragmentShader: MOON_FRAGMENT,
      uniforms: {
        uMoonMap: { value: null },
        uHasTexture: { value: 0 },
        uSunDir: { value: initialSun.clone() },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const haloMaterial = useMemo(() => {
    const initialSun = latLonToVector3(sunLatitude, sunLongitude, 1).normalize();
    return new ShaderMaterial({
      vertexShader: HALO_VERTEX,
      fragmentShader: HALO_FRAGMENT,
      uniforms: {
        uSunDir: { value: initialSun.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    let loadedTex: Texture | null = null;

    void loadTextureAsync("/textures/moon/moon_day_2k.webp", {
      colorSpace: SRGBColorSpace,
      anisotropy: maxAniso,
      minFilter: LinearMipmapLinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: ClampToEdgeWrapping,
      signal: controller.signal,
    })
      .then((tex) => {
        if (controller.signal.aborted) {
          disposeTexture(tex);
          return;
        }
        loadedTex = tex;
        moonMaterial.uniforms.uMoonMap!.value = tex;
        moonMaterial.uniforms.uHasTexture!.value = 1;
      })
      .catch(() => {});

    return () => {
      controller.abort();
      disposeTexture(loadedTex);
    };
  }, [gl, moonMaterial]);

  useEffect(() => {
    return () => {
      moonMaterial.dispose();
      haloMaterial.dispose();
    };
  }, [moonMaterial, haloMaterial]);

  useFrame((_, delta) => {
    const dLon = ((sunLongitude - curLonRef.current + 540) % 360) - 180;
    const dLat = sunLatitude - curLatRef.current;
    if (Math.abs(dLon) > 1e-3 || Math.abs(dLat) > 1e-3) {
      const step = 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
      curLonRef.current = normalizeLon(curLonRef.current + dLon * step);
      curLatRef.current = curLatRef.current + dLat * step;

      latLonToVector3(
        curLatRef.current,
        curLonRef.current,
        1,
        sunVecRef.current,
      ).normalize();
      moonMaterial.uniforms.uSunDir!.value.copy(sunVecRef.current);
      haloMaterial.uniforms.uSunDir!.value.copy(sunVecRef.current);
    }

    if (!reduceMotion && spinRef.current) {
      spinRef.current.rotation.y += delta * 0.004;
    }
  });

  return (
    <group
      ref={groupRef}
      name="background-moon"
      position={[MOON_POS.x, MOON_POS.y, MOON_POS.z]}
      rotation={[0.08, -0.65, -0.11]}
    >
      <group ref={spinRef}>
        <mesh material={moonMaterial} raycast={NOOP_RAYCAST}>
          <sphereGeometry args={[MOON_RADIUS, 48, 32]} />
        </mesh>
      </group>

      {/* Subtle silver-ivory lunar limb glow */}
      <mesh material={haloMaterial} raycast={NOOP_RAYCAST}>
        <sphereGeometry args={[MOON_RADIUS * 1.032, 48, 32]} />
      </mesh>
    </group>
  );
}
