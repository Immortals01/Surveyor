import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
} from "three";
import { detectDefaultQualityTier } from "@/lib/quality";
import { disposeTexture, loadTextureAsync } from "@/lib/textureLoader";
import { useAppStore } from "@/store/useAppStore";

const DOME_ROTATION: [number, number, number] = [0.41, 0.25, -0.18];
const STAR_COUNT = 14000;
const NOOP_RAYCAST = () => {};

const CELESTIAL_DOME_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalDir;

  void main() {
    vUv = uv;
    vLocalDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CELESTIAL_DOME_FRAGMENT = /* glsl */ `
  uniform sampler2D uStarsMap;
  uniform sampler2D uMilkyWayMap;
  uniform float uHasStars;
  uniform float uHasMilkyWay;

  varying vec2 vUv;
  varying vec3 vLocalDir;

  void main() {
    // Deep-space obsidian baseline with subtle zenith/galactic gradient
    vec3 baseVoid = vec3(0.0012, 0.0020, 0.0045);

    vec3 starTexel = uHasStars > 0.5
      ? texture2D(uStarsMap, vUv).rgb
      : vec3(0.0);

    vec3 mwTexel = uHasMilkyWay > 0.5
      ? texture2D(uMilkyWayMap, vUv).rgb
      : vec3(0.0);

    // Subtract low-level compression floor so empty space is pure obsidian
    vec3 cleanStars = max(vec3(0.0), starTexel - vec3(0.011));
    float starLuma = dot(cleanStars, vec3(0.299, 0.587, 0.114));

    // Separate pinpoint catalog stars from diffuse galactic background in the 8K map
    float pinpointMask = smoothstep(0.025, 0.22, starLuma);
    vec3 crispStars = pow(cleanStars, vec3(0.86)) * (1.15 + 0.85 * pinpointMask);

    // Enrich Galactic Milky Way dust continuum with warm core & cool spiral-arm rifts
    vec3 mwClean = max(vec3(0.0), mwTexel - vec3(0.015));
    float mwIntensity = dot(mwClean, vec3(0.333));
    float coreMask = smoothstep(0.12, 0.58, mwIntensity);
    vec3 outerArmTint = vec3(0.66, 0.78, 1.05);
    vec3 galacticCoreTint = vec3(1.12, 0.94, 0.76);
    vec3 mwGraded = mwClean * mix(outerArmTint, galacticCoreTint, coreMask) * 0.42;

    // Subtle dark dust-lane micro-contrast where starsTex has dark rifts inside the Milky Way band
    float dustRift = smoothstep(0.0, 0.09, starLuma);
    mwGraded *= (0.45 + 0.55 * dustRift);

    vec3 finalColor = baseVoid + crispStars + mwGraded;
    gl_FragColor = vec4(finalColor, 1.0);
    #include <colorspace_fragment>
  }
`;

const STAR_POINTS_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aProminence;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vProminence;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vProminence = aProminence;

    // Gentle high-altitude scintillation
    float wave = sin(uTime * (0.9 + aProminence * 1.4) + aPhase);
    vTwinkle = 0.88 + 0.12 * wave;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (0.92 + 0.08 * wave);
  }
`;

const STAR_POINTS_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vProminence;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;

    // Razor-sharp Airy disc core + soft optical halo
    float core = exp(-r2 * 18.0);
    float halo = exp(-r2 * 4.2) * (0.22 + 0.36 * vProminence);

    // Subtle 4-point diffraction spikes only on the brightest anchor stars
    float spikeX = exp(-abs(uv.y) * 26.0) * exp(-abs(uv.x) * 3.2);
    float spikeY = exp(-abs(uv.x) * 26.0) * exp(-abs(uv.y) * 3.2);
    float spikes = (spikeX + spikeY) * smoothstep(0.68, 0.98, vProminence) * 0.55;

    float intensity = (core + halo + spikes) * vTwinkle;
    vec3 col = mix(vColor, vec3(1.0), core * 0.55) * intensity;

    float alpha = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

// Spectral blackbody colors (O/B blue-white, A white, F/G ivory, K orange, M red-orange)
const SPECTRAL_PALETTE: [number, number, number, number][] = [
  [0.62, 0.76, 1.0, 0.1], // O/B blue-white
  [0.78, 0.86, 1.0, 0.22], // B/A blue-tinted white
  [0.95, 0.97, 1.0, 0.34], // A pure white
  [1.0, 0.97, 0.9, 0.18], // F/G solar ivory
  [1.0, 0.87, 0.72, 0.11], // K warm orange
  [1.0, 0.74, 0.52, 0.05], // M deep amber
];

function createStarCatalogGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const prominences = new Float32Array(count);

  // Deterministic LCG PRNG so star placement is stable across renders
  let seed = 19690720;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Galactic plane basis tilted ~62.87 deg to match the Equatorial NASA SVS map
  const galTilt = (62.87 * Math.PI) / 180;
  const galNode = (282.86 * Math.PI) / 180;
  const cosTilt = Math.cos(galTilt);
  const sinTilt = Math.sin(galTilt);
  const cosNode = Math.cos(galNode);
  const sinNode = Math.sin(galNode);

  for (let i = 0; i < count; i++) {
    const isGalacticBand = rand() < 0.46;
    let x: number;
    let y: number;
    let z: number;

    if (isGalacticBand) {
      // Concentrate stars along the Milky Way plane using a narrow Gaussian latitude
      const lon = rand() * Math.PI * 2;
      const u1 = Math.max(1e-6, rand());
      const u2 = rand();
      const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const lat = Math.max(-1.2, Math.min(1.2, gauss * 0.19));

      const cl = Math.cos(lat);
      const gx = cl * Math.cos(lon);
      const gy = Math.sin(lat);
      const gz = cl * Math.sin(lon);

      // Rotate from Galactic plane into Equatorial sky sphere
      const y1 = gy * cosTilt - gz * sinTilt;
      const z1 = gy * sinTilt + gz * cosTilt;
      x = gx * cosNode - z1 * sinNode;
      y = y1;
      z = gx * sinNode + z1 * cosNode;
    } else {
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      x = s * Math.cos(theta);
      y = u;
      z = s * Math.sin(theta);
    }

    // Place behind Earth (15.5) and Sun (62) at deep-space distances 84..91
    const radius = 84 + rand() * 7;
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;

    // Power-law apparent magnitude: mostly crisp sub-pixel pinpoints + rare bright navigational stars
    const magRoll = Math.pow(rand(), 4.2);
    prominences[i] = magRoll;

    // Screen-space point size (in CSS pixels before uPixelRatio)
    if (magRoll > 0.82) {
      sizes[i] = 3.2 + (magRoll - 0.82) * 11.0; // Bright anchor stars with diffraction spikes
    } else if (magRoll > 0.35) {
      sizes[i] = 1.65 + (magRoll - 0.35) * 2.4;
    } else {
      sizes[i] = 0.95 + magRoll * 1.8;
    }

    phases[i] = rand() * Math.PI * 2;

    // Pick spectral class
    let pick = rand();
    let rCol = 1.0;
    let gCol = 1.0;
    let bCol = 1.0;
    for (const [r, g, b, weight] of SPECTRAL_PALETTE) {
      if (pick <= weight) {
        rCol = r;
        gCol = g;
        bCol = b;
        break;
      }
      pick -= weight;
    }

    // Dimmer stars appear slightly desaturated to the human eye (Purkinje effect)
    const sat = 0.55 + 0.45 * Math.min(1, magRoll * 1.8);
    const luma = 0.299 * rCol + 0.587 * gCol + 0.114 * bCol;
    const brightness = 0.42 + 0.58 * Math.pow(magRoll, 0.45);

    colors[i * 3] = (luma + (rCol - luma) * sat) * brightness;
    colors[i * 3 + 1] = (luma + (gCol - luma) * sat) * brightness;
    colors[i * 3 + 2] = (luma + (bCol - luma) * sat) * brightness;
  }

  const geom = new BufferGeometry();
  geom.setAttribute("position", new BufferAttribute(positions, 3));
  geom.setAttribute("aColor", new BufferAttribute(colors, 3));
  geom.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geom.setAttribute("aPhase", new BufferAttribute(phases, 1));
  geom.setAttribute("aProminence", new BufferAttribute(prominences, 1));
  return geom;
}

export default function Starfield() {
  const { gl } = useThree();
  const qualitySetting = useAppStore((s) => s.settings.qualityTier);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);
  const defaultTierRef = useRef(detectDefaultQualityTier());

  const effectiveTier =
    qualitySetting === "auto" ? defaultTierRef.current : qualitySetting;

  const domeMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: CELESTIAL_DOME_VERTEX,
      fragmentShader: CELESTIAL_DOME_FRAGMENT,
      uniforms: {
        uStarsMap: { value: null },
        uMilkyWayMap: { value: null },
        uHasStars: { value: 0 },
        uHasMilkyWay: { value: 0 },
      },
      side: BackSide,
      depthWrite: false,
      toneMapped: false,
    });
  }, []);

  const starGeometry = useMemo(() => createStarCatalogGeometry(STAR_COUNT), []);

  const starPointsMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: STAR_POINTS_VERTEX,
      fragmentShader: STAR_POINTS_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
  }, [gl]);

  useEffect(() => {
    const controller = new AbortController();
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const canUse8K =
      gl.capabilities.maxTextureSize >= 8192 && effectiveTier === "high";

    let activeStarsTex: Texture | null = null;
    let activeMilkyWayTex: Texture | null = null;
    let upgradeTimerId = 0;

    const skyOpts = {
      colorSpace: SRGBColorSpace,
      anisotropy: maxAniso,
      minFilter: LinearMipmapLinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: ClampToEdgeWrapping,
      generateMipmaps: true,
      signal: controller.signal,
    } as const;

    // Load 4K baseline off-main-thread immediately for fast initial paint
    void loadTextureAsync("/textures/sky/stars_4k.webp", skyOpts)
      .then((tex4k) => {
        if (controller.signal.aborted) {
          disposeTexture(tex4k);
          return;
        }
        if (!activeStarsTex) {
          activeStarsTex = tex4k;
          domeMaterial.uniforms.uStarsMap!.value = tex4k;
          domeMaterial.uniforms.uHasStars!.value = 1;
        } else {
          disposeTexture(tex4k);
        }

        // Defer optional 8K celestial map upgrade until after initial boot completes
        // so it never competes with Moon L0/L1 tiles or stalls initial frame rate.
        if (canUse8K && !controller.signal.aborted) {
          upgradeTimerId = window.setTimeout(() => {
            void loadTextureAsync("/textures/sky/stars_8k.webp", skyOpts)
              .then((tex8k) => {
                if (controller.signal.aborted) {
                  disposeTexture(tex8k);
                  return;
                }
                const prev = activeStarsTex;
                activeStarsTex = tex8k;
                domeMaterial.uniforms.uStarsMap!.value = tex8k;
                domeMaterial.uniforms.uHasStars!.value = 1;
                if (prev && prev !== tex8k) {
                  disposeTexture(prev);
                }
              })
              .catch(() => {});
          }, 2600);
        }
      })
      .catch(() => {});

    void loadTextureAsync("/textures/sky/milkyway_4k.webp", skyOpts)
      .then((mwTex) => {
        if (controller.signal.aborted) {
          disposeTexture(mwTex);
          return;
        }
        activeMilkyWayTex = mwTex;
        domeMaterial.uniforms.uMilkyWayMap!.value = mwTex;
        domeMaterial.uniforms.uHasMilkyWay!.value = 1;
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (upgradeTimerId) window.clearTimeout(upgradeTimerId);
      disposeTexture(activeStarsTex);
      disposeTexture(activeMilkyWayTex);
    };
  }, [gl, domeMaterial, effectiveTier]);

  useEffect(() => {
    return () => {
      domeMaterial.dispose();
      starGeometry.dispose();
      starPointsMaterial.dispose();
    };
  }, [domeMaterial, starGeometry, starPointsMaterial]);

  useFrame(({ clock, gl: renderer }) => {
    const dpr = Math.min(renderer.getPixelRatio(), 2);
    if (starPointsMaterial.uniforms.uPixelRatio!.value !== dpr) {
      starPointsMaterial.uniforms.uPixelRatio!.value = dpr;
    }
    if (!reduceMotion) {
      starPointsMaterial.uniforms.uTime!.value = clock.getElapsedTime();
    }
  });

  return (
    <group name="starfield">
      {/* NASA SVS Celestial Sphere + aligned Galactic Milky Way dust continuum */}
      <mesh
        rotation={DOME_ROTATION}
        material={domeMaterial}
        raycast={NOOP_RAYCAST}
      >
        <sphereGeometry args={[94, 64, 32]} />
      </mesh>

      {/* 14,000 sub-pixel procedural Hipparcos/Galactic stars with Airy discs & spectral colors */}
      <points
        rotation={DOME_ROTATION}
        geometry={starGeometry}
        material={starPointsMaterial}
        raycast={NOOP_RAYCAST}
      />
    </group>
  );
}
