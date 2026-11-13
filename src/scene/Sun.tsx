import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DirectionalLight,
  Group,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { latLonToVector3, normalizeLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";

const SUN_VISUAL_DISTANCE = 62;
const SUN_DISC_RADIUS = 1.05;
const CORONA_SCALE = 16.0;
const GLARE_SCALE = 24.0;
const MOON_OCCLUDER_RADIUS = 1.002;

const BILLBOARD_VERTEX = /* glsl */ `
  uniform float uScale;
  varying vec2 vUv;

  void main() {
    vUv = uv * 2.0 - 1.0;
    vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mvCenter.xy += position.xy * uScale;
    gl_Position = projectionMatrix * mvCenter;
  }
`;

// Unified solar disc + K/F-corona shader (depth-tested so the Moon eclipses it naturally)
const CORONA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uDiscRadiusUv;

  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Smooth low-frequency coronal streamer harmonics (never clips into a sawtooth)
  float streamerHarmonics(float angle, float r, float t) {
    float s = 0.0;
    s += 0.45 * sin(angle * 4.0 + 0.6 + sin(t * 0.08 + r * 1.5) * 0.2);
    s += 0.30 * cos(angle * 7.0 - 1.2 + cos(t * 0.06 - r * 1.2) * 0.18);
    s += 0.15 * sin(angle * 12.0 + 2.0 + t * 0.05);
    s += 0.10 * cos(angle * 19.0 - 0.5 - t * 0.04);
    // Fine filament octave: narrow coronal threads drifting slowly outward (kept faint to stay alias-free)
    s += 0.06 * sin(angle * 31.0 + r * 5.0 - t * 0.09);
    return clamp(0.5 + 0.5 * s, 0.0, 1.0);
  }

  void main() {
    float r2 = dot(vUv, vUv);
    if (r2 > 1.0) discard;

    float r = sqrt(r2);
    float angle = atan(vUv.y, vUv.x);
    float edgeFade = smoothstep(1.0, 0.18, r);

    // 1. Defined photosphere with a screen-space anti-aliased limb (crisp at every zoom level)
    float discR = uDiscRadiusUv;
    float aa = clamp(fwidth(r) * 1.2, 1e-4, discR * 0.4);
    float discCore = 1.0 - smoothstep(discR * 0.92 - aa, discR * 1.03 + aa, r);

    // Softened Eddington limb darkening: interior dims gently toward the rim like the real photosphere
    float discMu = sqrt(max(0.0, 1.0 - min(1.0, (r / discR) * (r / discR))));
    float limb = mix(0.86, 1.0, discMu);

    // 2. Smooth radial distance outside the solar disc limb
    float dLimb = max(0.0, r - discR * 0.85);

    // 3. Silky inner & mid K-corona glow (kept < 1.0 outside disc so it never hard-clips)
    float streamers = streamerHarmonics(angle, r, uTime);
    float streamerMod = mix(0.88, 1.14, smoothstep(uDiscRadiusUv, 0.35, r) * streamers);

    float innerCorona = exp(-dLimb * 9.5) * 0.68 * streamerMod;
    float midCorona = exp(-r * 4.2) * 0.28 * streamerMod;

    // 4. Wide F-corona inverse-square dust aureole fading smoothly to 0 before r = 1.0
    float outerAureole = max(0.0, (0.036 / (r * r + 0.028) - 0.035)) * edgeFade;

    float rawIntensity = discCore * limb + (innerCorona + midCorona + outerAureole) * edgeFade;
    // Soft shoulder roll-off outside the disc so the bloom is velvety and perfectly round
    float intensity = clamp(1.0 - exp(-rawIntensity * 1.35), 0.0, 1.0);
    intensity = max(intensity, discCore * limb);

    // Seamless color temperature progression: pure white disc -> warm ivory -> golden outer corona
    vec3 colDisc = vec3(1.0, 0.998, 0.99);
    vec3 colInner = vec3(1.0, 0.93, 0.76);
    vec3 colOuter = vec3(1.0, 0.68, 0.34);

    vec3 color = mix(colDisc, colInner, smoothstep(discR * 0.85, 0.24, r));
    color = mix(color, colOuter, smoothstep(0.20, 0.78, r));
    color = mix(color, colDisc, discCore);
    // Warm photospheric rim tint tied to the limb-darkening profile
    color = mix(color, vec3(1.0, 0.84, 0.60), discCore * smoothstep(0.6, 0.0, discMu) * 0.7);

    // Sub-LSB dither to prevent 8-bit framebuffer Mach banding in dark space
    float dither = (hash12(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0);
    vec3 outCol = max(vec3(0.0), color * intensity + dither);

    gl_FragColor = vec4(outCol, intensity);
  }
`;

// Camera-space optical diffraction spikes & diamond-ring horizon flare
const GLARE_FRAGMENT = /* glsl */ `
  uniform float uVisibility;
  uniform float uLimbGrazing;
  uniform float uDiscRadiusUv;

  varying vec2 vUv;

  float needleSpike(vec2 uv, float rotRad, float sharpness, float radialDecay) {
    float c = cos(rotRad);
    float s = sin(rotRad);
    vec2 p = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
    float r = length(uv);
    // Needle-tapered optical spike: narrows smoothly as distance from center increases
    float widthProfile = sharpness * (1.0 + r * 4.2);
    float spineX = exp(-abs(p.y) * widthProfile) * exp(-abs(p.x) * radialDecay);
    float spineY = exp(-abs(p.x) * widthProfile) * exp(-abs(p.y) * radialDecay);
    return (spineX + spineY) * smoothstep(1.0, 0.08, r);
  }

  void main() {
    if (uVisibility <= 0.001) discard;

    float r2 = dot(vUv, vUv);
    if (r2 > 1.0) discard;

    float r = sqrt(r2);
    float edgeFade = smoothstep(1.0, 0.15, r);

    // Spikes fade in just outside the photosphere so their lobes never dent the round disc silhouette
    float spikeOnset = smoothstep(uDiscRadiusUv * 0.98, uDiscRadiusUv * 1.7, r);

    // 1. Primary 4-point spacecraft aperture diffraction spikes
    float mainSpikes = needleSpike(vUv, 0.12, 48.0, 3.1) * 0.46 * spikeOnset;

    // 2. Secondary 4-point diagonal aperture spikes (45 deg offset, finer and shorter)
    float diagSpikes = needleSpike(vUv, 0.12 + 0.785398, 68.0, 4.8) * 0.24 * spikeOnset;

    // 3. Diamond-ring horizon flare when the Sun grazes the lunar limb
    float horizonStreak = exp(-abs(vUv.y) * 60.0) * exp(-abs(vUv.x) * 2.1) * uLimbGrazing * 0.68;
    float diamondCore = exp(-r * 10.0) * (uLimbGrazing * 0.75);

    float intensity = (mainSpikes + diagSpikes + horizonStreak + diamondCore)
      * edgeFade
      * uVisibility;

    vec3 spikeTint = mix(
      vec3(1.0, 0.99, 0.96),
      vec3(1.0, 0.82, 0.52),
      smoothstep(0.06, 0.60, r)
    );

    vec3 col = spikeTint * intensity;
    gl_FragColor = vec4(col, clamp(intensity, 0.0, 1.0));
  }
`;

export default function Sun() {
  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const curLonRef = useRef(sunLongitude);
  const curLatRef = useRef(sunLatitude);

  const primaryLightRef = useRef<DirectionalLight>(null);
  const backLightRef = useRef<DirectionalLight>(null);
  const sunGroupRef = useRef<Group>(null);
  const sunWorldVecRef = useRef(
    latLonToVector3(sunLatitude, sunLongitude, SUN_VISUAL_DISTANCE),
  );

  const initialPositions = useMemo(() => {
    const primary = latLonToVector3(sunLatitude, sunLongitude, 24);
    const visual = latLonToVector3(
      sunLatitude,
      sunLongitude,
      SUN_VISUAL_DISTANCE,
    );
    const back = latLonToVector3(
      -sunLatitude + 8,
      normalizeLon(sunLongitude + 180),
      24,
    );
    return {
      sunPos: [primary.x, primary.y, primary.z] as [number, number, number],
      sunVisualPos: [visual.x, visual.y, visual.z] as [number, number, number],
      backPos: [back.x, back.y, back.z] as [number, number, number],
    };
    // Only needed for initial mount; dynamic updates happen smoothly in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billboardGeometry = useMemo(() => new PlaneGeometry(2, 2, 1, 1), []);

  const coronaMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: BILLBOARD_VERTEX,
      fragmentShader: CORONA_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: CORONA_SCALE * 0.5 },
        uDiscRadiusUv: { value: SUN_DISC_RADIUS / (CORONA_SCALE * 0.5) },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });
  }, []);

  const glareMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: BILLBOARD_VERTEX,
      fragmentShader: GLARE_FRAGMENT,
      uniforms: {
        uScale: { value: GLARE_SCALE * 0.5 },
        uVisibility: { value: 1 },
        uLimbGrazing: { value: 0 },
        uDiscRadiusUv: { value: SUN_DISC_RADIUS / (GLARE_SCALE * 0.5) },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      billboardGeometry.dispose();
      coronaMaterial.dispose();
      glareMaterial.dispose();
    };
  }, [billboardGeometry, coronaMaterial, glareMaterial]);

  const rayDirRef = useRef(new Vector3());
  const closestPointRef = useRef(new Vector3());
  const tmpVecRef = useRef(new Vector3());

  useFrame(({ camera, clock }, delta) => {
    if (!reduceMotion) {
      coronaMaterial.uniforms.uTime!.value = clock.getElapsedTime();
    }

    // Smoothly interpolate solar longitude & latitude along shortest arc
    const dLon = ((sunLongitude - curLonRef.current + 540) % 360) - 180;
    const dLat = sunLatitude - curLatRef.current;
    if (Math.abs(dLon) > 1e-3 || Math.abs(dLat) > 1e-3) {
      const step = 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
      curLonRef.current = normalizeLon(curLonRef.current + dLon * step);
      curLatRef.current = curLatRef.current + dLat * step;

      const lat = curLatRef.current;
      const lon = curLonRef.current;
      const tmp = tmpVecRef.current;

      if (primaryLightRef.current) {
        latLonToVector3(lat, lon, 24, tmp);
        primaryLightRef.current.position.copy(tmp);
      }
      if (backLightRef.current) {
        latLonToVector3(-lat + 8, normalizeLon(lon + 180), 24, tmp);
        backLightRef.current.position.copy(tmp);
      }
      latLonToVector3(lat, lon, SUN_VISUAL_DISTANCE, sunWorldVecRef.current);
      if (sunGroupRef.current) {
        sunGroupRef.current.position.copy(sunWorldVecRef.current);
      }
    }

    // Compute analytical line-of-sight solar occlusion against the Moon sphere at origin
    const sunWorldVec = sunWorldVecRef.current;
    const camPos = camera.position;
    const rayDir = rayDirRef.current.subVectors(sunWorldVec, camPos);
    const rayLen = rayDir.length();
    if (rayLen > 1e-4) {
      rayDir.divideScalar(rayLen);
      // Closest approach of segment [camPos -> sunWorldVec] to Moon origin (0,0,0)
      const tProj = Math.max(0, Math.min(rayLen, -camPos.dot(rayDir)));
      const closestPt = closestPointRef.current
        .copy(camPos)
        .addScaledVector(rayDir, tProj);
      const distToMoonCenter = closestPt.length();

      // Apparent solar disc radius projected to the Moon's distance from camera
      const projectedSunRadius =
        SUN_DISC_RADIUS * (Math.max(0.5, tProj) / rayLen) * 1.25;
      const innerEdge = MOON_OCCLUDER_RADIUS - projectedSunRadius;
      const outerEdge = MOON_OCCLUDER_RADIUS + projectedSunRadius;

      const rawVis = Math.max(
        0,
        Math.min(
          1,
          (distToMoonCenter - innerEdge) / Math.max(1e-4, outerEdge - innerEdge),
        ),
      );
      // Smooth hermite interpolation
      const visibility = rawVis * rawVis * (3 - 2 * rawVis);
      // Peaks at 1.0 right as the solar disc grazes the lunar horizon (Apollo diamond ring)
      const limbGrazing = 4 * visibility * (1 - visibility);

      glareMaterial.uniforms.uVisibility!.value = visibility;
      glareMaterial.uniforms.uLimbGrazing!.value = limbGrazing;
    }
  });

  return (
    <>
      {/* Primary solar illumination */}
      <directionalLight
        ref={primaryLightRef}
        position={initialPositions.sunPos}
        intensity={2.65}
        color="#fff8ee"
      />

      {/* Visible solar disc, smooth K/F corona, and spacecraft optical glare */}
      <group
        ref={sunGroupRef}
        position={initialPositions.sunVisualPos}
        name="solar-disc"
      >
        {/* Depth-tested solar disc & K/F-corona */}
        <mesh
          geometry={billboardGeometry}
          material={coronaMaterial}
          frustumCulled={false}
          renderOrder={1}
        />

        {/* Optical aperture diffraction spikes & lunar-horizon diamond-ring glare */}
        <mesh
          geometry={billboardGeometry}
          material={glareMaterial}
          frustumCulled={false}
          renderOrder={2}
        />
      </group>

      {/* Subtle Earthshine & back-side fill so farside and night craters remain legible */}
      <directionalLight
        ref={backLightRef}
        position={initialPositions.backPos}
        intensity={1.45}
        color="#dbeafe"
      />

      {/* Global ambient & hemisphere fill (including folded quadrature fill) so every crater and farside basin stays clear */}
      <hemisphereLight
        args={["#f1f5f9", "#94a3b8", 0.92]}
      />
      <ambientLight intensity={0.56} color="#dce6f5" />
    </>
  );
}
