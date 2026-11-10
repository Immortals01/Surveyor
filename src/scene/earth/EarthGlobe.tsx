import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
} from "three";
import { latLonToVector3, normalizeLon } from "@/lib/geo";
import { disposeTexture, loadTextureAsync } from "@/lib/textureLoader";
import { useAppStore } from "@/store/useAppStore";

export const EARTH_SCENE_RADIUS = 1.0;
const HALO_RADIUS = 1.036;
const NOOP_RAYCAST = () => {};

const EARTH_GLOBE_VERTEX = /* glsl */ `
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

const EARTH_GLOBE_FRAGMENT = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uCloudsMap;
  uniform sampler2D uSpecMap;
  uniform sampler2D uLightsMap;
  uniform float uHasDay;
  uniform float uHasNormal;
  uniform float uHasClouds;
  uniform float uHasSpec;
  uniform float uHasLights;
  uniform float uCloudOffset;
  uniform vec3 uSunDir;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vWorldPos;

  void main() {
    vec3 geomN = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    // Construct spherical tangent-space basis (East = +U, North = +V)
    vec3 upVec = vec3(0.0, 1.0, 0.0);
    vec3 T = cross(upVec, geomN);
    float tLen = length(T);
    T = tLen > 1e-4 ? T / tLen : vec3(0.0, 0.0, -1.0);
    vec3 B = normalize(cross(geomN, T));

    // Perturb surface normal in tangent space so mountain chains (Andes, Himalayas, Rockies, Alps) have crisp solar relief
    vec3 N = geomN;
    if (uHasNormal > 0.5) {
      vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      mapN.xy *= 1.85;
      N = normalize(T * mapN.x + B * mapN.y + geomN * max(0.2, mapN.z));
    }

    float geomSunDot = dot(geomN, L);
    float sunDot = dot(N, L);
    float ndotv = max(0.0, dot(geomN, V));

    // Smooth atmospheric terminator driven by macro geometry, relief driven by perturbed normal
    float dayFactor = smoothstep(-0.14, 0.16, geomSunDot);
    float diffuse = max(0.0, sunDot);
    float macroDiffuse = max(0.0, geomSunDot);
    float twilight = smoothstep(-0.18, 0.05, geomSunDot) * (1.0 - smoothstep(0.0, 0.28, geomSunDot));

    vec3 daySample = uHasDay > 0.5
      ? texture2D(uDayMap, vUv).rgb
      : vec3(0.07, 0.25, 0.58);
    float specMask = uHasSpec > 0.5 ? texture2D(uSpecMap, vUv).r : 0.65;
    float clouds = uHasClouds > 0.5
      ? texture2D(uCloudsMap, vec2(vUv.x + uCloudOffset, vUv.y)).r
      : 0.0;
    vec3 lightsSample = uHasLights > 0.5
      ? texture2D(uLightsMap, vUv).rgb
      : vec3(0.0);

    // Rich sapphire water shading & vibrant continental tones
    vec3 baseAlbedo = pow(daySample, vec3(0.95)) * 1.12;
    vec3 oceanRich = baseAlbedo * vec3(0.92, 1.20, 1.68) + vec3(0.018, 0.085, 0.22);
    baseAlbedo = mix(baseAlbedo, oceanRich, specMask * 0.66);

    // Ocean specular reflection & sun glint (masked by clouds & water mask)
    vec3 H = normalize(L + V);
    float specCore = pow(max(0.0, dot(N, H)), 56.0);
    float specBroad = pow(max(0.0, dot(geomN, H)), 16.0) * 0.25;
    float spec = (specCore + specBroad) * specMask * (1.0 - clouds * 0.88) * dayFactor;
    vec3 specColor = mix(vec3(0.86, 0.94, 1.0), vec3(1.0, 0.84, 0.62), twilight * 0.6) * spec * 0.28;

    // Illuminated day surface + drifting cloud deck
    float litIntensity = 0.14 + 0.86 * (0.65 * pow(diffuse, 0.82) + 0.35 * pow(macroDiffuse, 0.75));
    vec3 daySurface = baseAlbedo * litIntensity + specColor;
    vec3 cloudColor = mix(vec3(0.97, 0.99, 1.0), vec3(1.0, 0.78, 0.58), twilight * 0.55);
    float cloudAlpha = smoothstep(0.05, 0.72, clouds) * 0.84;
    float cloudLit = 0.20 + 0.88 * pow(macroDiffuse, 0.72);
    vec3 dayWithClouds = mix(daySurface, cloudColor * cloudLit, cloudAlpha);

    // Rayleigh blue atmospheric scattering toward the sunlit limb
    float fresnel = pow(1.0 - ndotv, 3.0);
    vec3 atmosphereTint = mix(vec3(0.26, 0.62, 1.0), vec3(0.96, 0.56, 0.32), twilight * 0.48);
    float limbSun = smoothstep(-0.22, 0.42, geomSunDot);
    dayWithClouds = mix(dayWithClouds, atmosphereTint, fresnel * 0.52 * limbSun);
    dayWithClouds += vec3(0.20, 0.52, 1.0) * pow(1.0 - ndotv, 4.4) * 0.46 * limbSun;

    // Night hemisphere: subtle starlight/moonlight continental visibility + warm golden city lights
    float nightRelief = 0.82 + 0.18 * dot(N, geomN);
    vec3 nightBase = (baseAlbedo * 0.085 + vec3(0.008, 0.016, 0.032)) * nightRelief;
    vec3 nightClouds = mix(nightBase, nightBase + vec3(0.025, 0.038, 0.062), cloudAlpha * 0.45);

    float cityBrightness = smoothstep(
      0.20,
      0.80,
      max(lightsSample.r, lightsSample.g) - lightsSample.b * 0.62
    );
    vec3 cityGlow = vec3(1.0, 0.78, 0.42) * cityBrightness * (1.0 - clouds * 0.72) * 0.92;
    float nightMask = 1.0 - smoothstep(-0.08, 0.10, geomSunDot);
    vec3 nightSide = nightClouds + cityGlow * nightMask + vec3(0.04, 0.08, 0.18) * fresnel * 0.35;

    vec3 finalColor = mix(nightSide, dayWithClouds, dayFactor);
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
    // On a BackSide sphere, vNormalView.z is 0 at the outer silhouette and -1 at the center.
    float viewZ = clamp(-vNormalView.z, 0.0, 1.0);
    float rim = pow(smoothstep(0.0, 0.44, viewZ), 2.2);

    vec3 N = normalize(-vNormalWorld);
    float sunDot = dot(N, normalize(uSunDir));
    float sunFacing = smoothstep(-0.28, 0.45, sunDot);
    float twilight = smoothstep(-0.22, 0.06, sunDot) * (1.0 - smoothstep(0.0, 0.30, sunDot));

    vec3 dayGlow = mix(vec3(0.20, 0.48, 0.92), vec3(0.38, 0.74, 1.0), sunFacing);
    vec3 glowColor = mix(dayGlow, vec3(0.95, 0.62, 0.38), twilight * 0.32);
    float alpha = rim * (0.14 + 0.86 * sunFacing) * 0.58;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export default function EarthGlobe() {
  const { gl } = useThree();
  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const curLonRef = useRef(sunLongitude);
  const curLatRef = useRef(sunLatitude);
  const sunVecRef = useRef(
    latLonToVector3(sunLatitude, sunLongitude, 1).normalize(),
  );

  const earthMaterial = useMemo(() => {
    const initialSun = latLonToVector3(sunLatitude, sunLongitude, 1).normalize();
    return new ShaderMaterial({
      vertexShader: EARTH_GLOBE_VERTEX,
      fragmentShader: EARTH_GLOBE_FRAGMENT,
      uniforms: {
        uDayMap: { value: null },
        uNormalMap: { value: null },
        uCloudsMap: { value: null },
        uSpecMap: { value: null },
        uLightsMap: { value: null },
        uHasDay: { value: 0 },
        uHasNormal: { value: 0 },
        uHasClouds: { value: 0 },
        uHasSpec: { value: 0 },
        uHasLights: { value: 0 },
        uCloudOffset: { value: 0 },
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
    const loaded: Texture[] = [];

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
        })
        .catch(() => {});
    };

    loadTex("/textures/earth/earth_day_2k.webp", true, (day) => {
      earthMaterial.uniforms.uDayMap!.value = day;
      earthMaterial.uniforms.uHasDay!.value = 1;
    });
    loadTex("/textures/earth/earth_normal_2k.webp", false, (normal) => {
      earthMaterial.uniforms.uNormalMap!.value = normal;
      earthMaterial.uniforms.uHasNormal!.value = 1;
    });
    loadTex("/textures/earth/earth_clouds_2k.webp", false, (clouds) => {
      earthMaterial.uniforms.uCloudsMap!.value = clouds;
      earthMaterial.uniforms.uHasClouds!.value = 1;
    });
    loadTex("/textures/earth/earth_specular_2k.webp", false, (spec) => {
      earthMaterial.uniforms.uSpecMap!.value = spec;
      earthMaterial.uniforms.uHasSpec!.value = 1;
    });
    loadTex("/textures/earth/earth_lights_2k.webp", true, (lights) => {
      earthMaterial.uniforms.uLightsMap!.value = lights;
      earthMaterial.uniforms.uHasLights!.value = 1;
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
      earthMaterial.uniforms.uSunDir!.value.copy(sunVecRef.current);
      haloMaterial.uniforms.uSunDir!.value.copy(sunVecRef.current);
    }

    if (!reduceMotion) {
      earthMaterial.uniforms.uCloudOffset!.value =
        (earthMaterial.uniforms.uCloudOffset!.value + delta * 0.00085) % 1;
    }
  });

  return (
    <group name="earth-primary-globe" position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <mesh material={earthMaterial} receiveShadow={false}>
        <sphereGeometry args={[EARTH_SCENE_RADIUS, 96, 64]} />
      </mesh>

      {/* BackSide Rayleigh atmospheric limb halo */}
      <mesh material={haloMaterial} raycast={NOOP_RAYCAST}>
        <sphereGeometry args={[HALO_RADIUS, 64, 48]} />
      </mesh>
    </group>
  );
}
