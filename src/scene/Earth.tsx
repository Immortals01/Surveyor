import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import { latLonToVector3 } from "@/lib/geo";
import { disposeTexture, loadTextureAsync } from "@/lib/textureLoader";
import { useAppStore } from "@/store/useAppStore";

const EARTH_DISTANCE = 15.5;
const EARTH_RADIUS = 0.86;
const AXIAL_TILT_RAD = (23.44 * Math.PI) / 180;
const NOOP_RAYCAST = () => {};

// Positioned beyond the Moon's eastern limb so Earth hangs naturally in deep space
// during the Intro and nearside views, and rises over the lunar horizon on Earthrise.
const EARTH_POS = latLonToVector3(7.5, 36, EARTH_DISTANCE);

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uCloudsMap;
  uniform sampler2D uSpecMap;
  uniform sampler2D uLightsMap;
  uniform float uHasTextures;
  uniform float uCloudOffset;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    float sunDot = dot(N, L);
    float ndotv = max(0.0, dot(N, V));

    // Crisp but realistic atmospheric terminator transition
    float dayFactor = smoothstep(-0.12, 0.16, sunDot);
    float diffuse = max(0.0, sunDot);
    float twilight = smoothstep(-0.16, 0.04, sunDot) * (1.0 - smoothstep(0.0, 0.24, sunDot));

    vec3 daySample = uHasTextures > 0.5
      ? texture2D(uDayMap, vUv).rgb
      : vec3(0.07, 0.24, 0.56);
    float specMask = uHasTextures > 0.5 ? texture2D(uSpecMap, vUv).r : 0.7;
    float clouds = uHasTextures > 0.5
      ? texture2D(uCloudsMap, vec2(vUv.x + uCloudOffset, vUv.y)).r
      : 0.0;

    // Enrich ocean sapphire hue (using water mask) while keeping warm continental tones
    vec3 baseAlbedo = pow(daySample, vec3(0.95)) * 1.12;
    vec3 oceanRich = baseAlbedo * vec3(0.95, 1.22, 1.72) + vec3(0.02, 0.09, 0.24);
    baseAlbedo = mix(baseAlbedo, oceanRich, specMask * 0.68);

    // Subtle solar glint on open water (masked by clouds & specMap)
    vec3 specColor = vec3(0.0);
    if (dayFactor > 0.0 && specMask > 0.01) {
      vec3 H = normalize(L + V);
      float spec = pow(max(0.0, dot(N, H)), 64.0) * specMask * (1.0 - clouds * 0.9) * dayFactor;
      specColor = vec3(0.85, 0.93, 1.0) * spec * 0.22;
    }

    // Illuminated day surface + cloud layer
    float litIntensity = 0.14 + 0.86 * pow(diffuse, 0.75);
    vec3 daySurface = baseAlbedo * litIntensity + specColor;
    vec3 cloudColor = mix(vec3(0.97, 0.99, 1.0), vec3(1.0, 0.8, 0.62), twilight * 0.5);
    float cloudAlpha = smoothstep(0.04, 0.72, clouds) * 0.88;
    vec3 dayWithClouds = mix(daySurface, cloudColor * (0.2 + 0.88 * litIntensity), cloudAlpha);

    // Rayleigh blue atmospheric scattering toward the sunlit limb
    float oneMinusNdotV = 1.0 - ndotv;
    float fresnel = oneMinusNdotV * oneMinusNdotV * oneMinusNdotV;
    vec3 atmosphereTint = mix(vec3(0.28, 0.64, 1.0), vec3(0.95, 0.58, 0.34), twilight * 0.45);
    float limbSun = smoothstep(-0.2, 0.4, sunDot);
    dayWithClouds = mix(dayWithClouds, atmosphereTint, fresnel * 0.55 * limbSun);
    dayWithClouds += vec3(0.22, 0.54, 1.0) * pow(oneMinusNdotV, 4.5) * 0.5 * limbSun;

    // Night side: deep space dark surface + thresholded warm city lights (ignores purple JPEG background)
    vec3 nightBase = baseAlbedo * 0.018;
    float nightMask = 1.0 - smoothstep(-0.08, 0.08, sunDot);
    vec3 cityGlow = vec3(0.0);
    if (nightMask > 0.0 && uHasTextures > 0.5) {
      vec3 lightsSample = texture2D(uLightsMap, vUv).rgb;
      float cityBrightness = smoothstep(0.24, 0.82, max(lightsSample.r, lightsSample.g) - lightsSample.b * 0.65);
      cityGlow = vec3(1.0, 0.78, 0.42) * cityBrightness * (1.0 - clouds * 0.75) * 0.85;
    }
    vec3 nightSide = nightBase + cityGlow * nightMask;

    vec3 finalColor = mix(nightSide, dayWithClouds, dayFactor);
    gl_FragColor = vec4(finalColor, 1.0);
    #include <colorspace_fragment>
  }
`;

const HALO_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vNormalView;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vNormalWorld;
  varying vec3 vNormalView;
  varying vec3 vWorldPos;

  void main() {
    // On a BackSide sphere, vNormalView.z is 0 at the outer silhouette and -1 at the center.
    float viewZ = clamp(-vNormalView.z, 0.0, 1.0);
    float rim = pow(smoothstep(0.0, 0.42, viewZ), 2.2);

    vec3 N = normalize(-vNormalWorld);
    float sunDot = dot(N, normalize(uSunDir));
    float sunFacing = smoothstep(-0.25, 0.45, sunDot);

    vec3 glowColor = mix(vec3(0.18, 0.45, 0.88), vec3(0.38, 0.74, 1.0), sunFacing);
    float alpha = rim * (0.08 + 0.92 * sunFacing) * 0.55;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export default function Earth() {
  const { gl } = useThree();
  const earthGroupRef = useRef<Group>(null);
  const spinGroupRef = useRef<Group>(null);

  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const sunDir = useMemo(() => {
    // Orient solar illumination on Earth so the hemisphere facing the Moon displays
    // a bright gibbous Blue Marble with a crisp curved twilight terminator.
    return latLonToVector3(sunLatitude + 22, sunLongitude - 68, 1).normalize();
  }, [sunLatitude, sunLongitude]);

  const earthMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: EARTH_VERTEX,
      fragmentShader: EARTH_FRAGMENT,
      uniforms: {
        uDayMap: { value: null },
        uCloudsMap: { value: null },
        uSpecMap: { value: null },
        uLightsMap: { value: null },
        uHasTextures: { value: 0 },
        uCloudOffset: { value: 0 },
        uSunDir: { value: new Vector3(1, 0, 0) },
      },
    });
  }, []);

  const haloMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: HALO_VERTEX,
      fragmentShader: HALO_FRAGMENT,
      uniforms: {
        uSunDir: { value: new Vector3(1, 0, 0) },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    });
  }, []);

  useEffect(() => {
    earthMaterial.uniforms.uSunDir!.value.copy(sunDir);
    haloMaterial.uniforms.uSunDir!.value.copy(sunDir);
  }, [earthMaterial, haloMaterial, sunDir]);

  useEffect(() => {
    const controller = new AbortController();
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const loaded: Texture[] = [];
    let readyCount = 0;

    const loadTex = (
      url: string,
      srgb: boolean,
      onDone: (t: Texture) => void,
    ) => {
      void loadTextureAsync(url, {
        colorSpace: srgb ? SRGBColorSpace : NoColorSpace,
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
          loaded.push(tex);
          onDone(tex);
          readyCount += 1;
          if (readyCount === 4) {
            earthMaterial.uniforms.uHasTextures!.value = 1;
          }
        })
        .catch(() => {});
    };

    loadTex("/textures/earth/earth_day_2k.webp", true, (day) => {
      earthMaterial.uniforms.uDayMap!.value = day;
    });
    loadTex("/textures/earth/earth_clouds_2k.webp", false, (clouds) => {
      earthMaterial.uniforms.uCloudsMap!.value = clouds;
    });
    loadTex("/textures/earth/earth_specular_2k.webp", false, (spec) => {
      earthMaterial.uniforms.uSpecMap!.value = spec;
    });
    loadTex("/textures/earth/earth_lights_2k.webp", true, (lights) => {
      earthMaterial.uniforms.uLightsMap!.value = lights;
    });

    return () => {
      controller.abort();
      for (const t of loaded) disposeTexture(t);
    };
  }, [gl, earthMaterial]);

  useEffect(() => {
    return () => {
      earthMaterial.dispose();
      haloMaterial.dispose();
    };
  }, [earthMaterial, haloMaterial]);

  useFrame((_, delta) => {
    if (reduceMotion) return;
    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y += delta * 0.012;
    }
    earthMaterial.uniforms.uCloudOffset!.value =
      (earthMaterial.uniforms.uCloudOffset!.value + delta * 0.0012) % 1;
  });

  return (
    <group
      ref={earthGroupRef}
      name="earth-globe"
      position={[EARTH_POS.x, EARTH_POS.y, EARTH_POS.z]}
      rotation={[0.24, 0, -AXIAL_TILT_RAD * 0.65]}
    >
      <group ref={spinGroupRef} rotation={[0, 2.55, 0]}>
        <mesh material={earthMaterial} raycast={NOOP_RAYCAST}>
          <sphereGeometry args={[EARTH_RADIUS, 48, 32]} />
        </mesh>
      </group>

      {/* Soft Rayleigh atmospheric limb halo with zero outer-edge cutoff */}
      <mesh material={haloMaterial} raycast={NOOP_RAYCAST}>
        <sphereGeometry args={[EARTH_RADIUS * 1.038, 48, 32]} />
      </mesh>
    </group>
  );
}
