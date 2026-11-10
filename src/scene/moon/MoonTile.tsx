import { useEffect, useMemo, useRef } from "react";
import { Color, MeshStandardMaterial, Vector2 } from "three";
import {
  applyTileDisplacement,
  createTileGeometry,
} from "./createTileGeometry";
import { moonTileManager } from "./tileManager";

interface MoonTileProps {
  row: number;
  col: number;
  segments: number;
  heightReady: boolean;
  debugTiles: boolean;
}

const DEBUG_COLORS: Record<number, string> = {
  0: "#64748b",
  1: "#38bdf8",
  2: "#4ade80",
  3: "#facc15",
};

function getTexWidth(tex: { image?: unknown } | null, fallback: number): number {
  const img = tex?.image as { width?: number } | undefined;
  return typeof img?.width === "number" && img.width > 0 ? img.width : fallback;
}

export default function MoonTile({
  row,
  col,
  segments,
  heightReady,
  debugTiles,
}: MoonTileProps) {
  const geometry = useMemo(
    () => createTileGeometry(row, col, segments),
    [row, col, segments],
  );

  const uniformsRef = useRef({
    uColorRes: { value: 512 },
    uNormalRes: { value: 360 },
  });

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: new Color("#c8c2b6"),
      roughness: 0.97,
      metalness: 0.0,
      normalScale: new Vector2(1.1, 1.1),
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uColorRes = uniformsRef.current.uColorRes;
      shader.uniforms.uNormalRes = uniformsRef.current.uNormalRes;

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vSpherePos;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vSpherePos = normalize(transformed);`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vSpherePos;
uniform float uColorRes;
uniform float uNormalRes;

// 4-tap hardware-accelerated 16-sample 2D cubic B-spline texture filter
// Eliminates bilinear texel grid / blockiness when zoomed into a landing site
vec4 sampleBicubic(sampler2D tex, vec2 uv, float res) {
  vec2 p = uv * res - 0.5;
  vec2 fw = fwidth(p);
  float mag = clamp(1.0 - max(fw.x, fw.y) * 1.15, 0.0, 1.0);
  if (mag <= 0.01) {
    return texture2D(tex, uv);
  }
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 o = 1.0 - f;
  vec2 w0 = (o * o * o) / 6.0;
  vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / res;
  vec2 h1 = (i + 1.5 + w3 / g1) / res;
  vec4 t00 = texture2D(tex, vec2(h0.x, h0.y));
  vec4 t10 = texture2D(tex, vec2(h1.x, h0.y));
  vec4 t01 = texture2D(tex, vec2(h0.x, h1.y));
  vec4 t11 = texture2D(tex, vec2(h1.x, h1.y));
  vec4 bicubic = mix(mix(t11, t01, g0.x), mix(t10, t00, g0.x), g0.y);
  if (mag >= 0.99) return bicubic;
  return mix(texture2D(tex, uv), bicubic, mag);
}

float regolithHash(vec3 p) {
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
      mix(regolithHash(i + vec3(0, 0, 0)), regolithHash(i + vec3(1, 0, 0)), u.x),
      mix(regolithHash(i + vec3(0, 1, 0)), regolithHash(i + vec3(1, 1, 0)), u.x),
      u.y
    ),
    mix(
      mix(regolithHash(i + vec3(0, 0, 1)), regolithHash(i + vec3(1, 0, 1)), u.x),
      mix(regolithHash(i + vec3(0, 1, 1)), regolithHash(i + vec3(1, 1, 1)), u.x),
      u.y
    ),
    u.z
  );
}

float regolithFbm(vec3 p) {
  float v = 0.0;
  v += 0.50 * regolithNoise(p);
  v += 0.28 * regolithNoise(p * 2.35 + vec3(17.1, 31.7, 11.3));
  v += 0.14 * regolithNoise(p * 5.60 + vec3(43.2, 13.9, 29.4));
  v += 0.08 * regolithNoise(p * 13.2 + vec3(7.4, 53.1, 37.8));
  return v - 0.5;
}`,
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
  vec4 sampledDiffuseColor = sampleBicubic(map, vMapUv, uColorRes);
  float closeDetail = smoothstep(1.05, 0.20, length(vViewPosition));
  if (closeDetail > 0.005) {
    float grain = regolithFbm(vSpherePos * 260.0);
    sampledDiffuseColor.rgb *= 1.0 + grain * 0.065 * closeDetail;
  }
  diffuseColor *= sampledDiffuseColor;
#endif`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#ifdef USE_NORMALMAP_OBJECTSPACE
  normal = sampleBicubic(normalMap, vNormalMapUv, uNormalRes).xyz * 2.0 - 1.0;
  #ifdef FLIP_SIDED
    normal = - normal;
  #endif
  #ifdef DOUBLE_SIDED
    normal = normal * faceDirection;
  #endif
  normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
  vec3 mapN = sampleBicubic(normalMap, vNormalMapUv, uNormalRes).xyz * 2.0 - 1.0;
  float closeNrm = smoothstep(1.05, 0.20, length(vViewPosition));
  mapN.xy *= normalScale * mix(1.0, 0.78, closeNrm);
  if (closeNrm > 0.005) {
    vec3 sp = vSpherePos * 260.0;
    float eps = 0.08;
    float h0 = regolithFbm(sp);
    float hx = regolithFbm(sp + vec3(eps, 0.0, 0.0)) - h0;
    float hy = regolithFbm(sp + vec3(0.0, eps, 0.0)) - h0;
    mapN.xy += vec2(hx, hy) * (1.35 * closeNrm);
  }
  normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
  normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,
        );
    };
    mat.customProgramCacheKey = () => "moon-tile-bicubic-regolith-v1";
    return mat;
  }, []);

  const currentLevelRef = useRef<number>(0);

  // Dispose geometry & material on unmount / segment change
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Staggered vertex displacement once LOLA height buffer arrives
  useEffect(() => {
    if (!heightReady) return;
    const delayMs = (row * 8 + col) * 6;
    const timer = window.setTimeout(() => {
      applyTileDisplacement(geometry, row, col, segments);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [heightReady, geometry, row, col, segments]);

  // Subscribe to progressive color & normal textures
  useEffect(() => {
    return moonTileManager.subscribe(row, col, (state) => {
      currentLevelRef.current = Math.max(0, state.colorLevel);
      if (state.colorTex && material.map !== state.colorTex) {
        const hadMap = Boolean(material.map);
        material.map = state.colorTex;
        uniformsRef.current.uColorRes.value = getTexWidth(
          state.colorTex,
          state.colorLevel === 3
            ? 2048
            : state.colorLevel === 2
              ? 1024
              : state.colorLevel === 1
                ? 512
                : 128,
        );
        material.color.set(
          debugTiles
            ? (DEBUG_COLORS[currentLevelRef.current] ?? "#ffffff")
            : "#ffffff",
        );
        if (!hadMap) {
          material.needsUpdate = true;
        }
      }
      if (state.normalTex && material.normalMap !== state.normalTex) {
        const hadNormal = Boolean(material.normalMap);
        material.normalMap = state.normalTex;
        uniformsRef.current.uNormalRes.value = getTexWidth(
          state.normalTex,
          state.normalLevel === 3
            ? 1440
            : state.normalLevel === 2
              ? 720
              : state.normalLevel === 1
                ? 360
                : 128,
        );
        if (!hadNormal) {
          material.needsUpdate = true;
        }
      }
    });
  }, [row, col, material, debugTiles]);

  useEffect(() => {
    if (!material.map) return;
    material.color.set(
      debugTiles
        ? (DEBUG_COLORS[currentLevelRef.current] ?? "#ffffff")
        : "#ffffff",
    );
  }, [debugTiles, material]);

  return <mesh geometry={geometry} material={material} receiveShadow={false} />;
}
