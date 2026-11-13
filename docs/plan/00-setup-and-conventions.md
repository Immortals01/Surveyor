# Phase 0 — Setup & Conventions

**Goal:** A clean, typed, linted Vite + React + R3F project that renders an empty `<Canvas>` and a HUD layer, with the folder structure and conventions everyone codes against.

**Estimated effort:** 2–3 hours.

---

## 0.1 Scaffold (P0)

Run these from the repo root (`nasa-test/`). Vite will ask about the non-empty directory. Choose "Ignore files and continue".

```bash
npm create vite@latest . -- --template react-ts
npm install

# 3D
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# UI, animation, state, validation
npm install motion zustand zod clsx
npm install -D tailwindcss @tailwindcss/vite

# Testing & quality
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D prettier eslint-config-prettier

# Asset pipeline (Node scripts only; not shipped to the browser)
npm install -D sharp @gltf-transform/cli
```

> [!NOTE]
> Use the latest stable versions. `@react-three/fiber` v9 pairs with React 19, and `drei` v10 pairs with fiber v9. Framer Motion now ships as the `motion` package (`import { motion } from "motion/react"`).

### Config tasks

- [ ] **P0** `vite.config.ts`: add `@tailwindcss/vite` plugin; add path alias `@/` → `src/`.
- [ ] **P0** `tsconfig.app.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `paths: { "@/*": ["src/*"] }`.
- [ ] **P0** `src/index.css`: `@import "tailwindcss";` plus theme tokens (see 0.4).
- [ ] **P0** `package.json` scripts:

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "assets:fetch": "node scripts/fetch-moon-kit.mjs",
    "assets:textures": "node scripts/build-textures.mjs",
    "assets:models": "node scripts/optimize-models.mjs",
    "content:check": "vitest run src/data"
  }
}
```

- [ ] **P0** `.gitignore`: add `raw/` (multi-hundred-MB NASA source TIFFs and models are never committed) and `*.local`.
- [ ] **P1** GitHub Action: `npm ci && npm run lint && npm test && npm run build` on push.

---

## 0.2 Folder Structure (P0)

```text
nasa-test/
├── docs/plan/                    # This plan
├── raw/                          # (gitignored) downloaded NASA source files
├── scripts/                      # Node asset pipeline scripts
│   ├── fetch-moon-kit.mjs
│   ├── build-textures.mjs
│   ├── optimize-models.mjs
│   └── generate-narration.mjs    # (P1) optional pre-generated voice clips
├── public/
│   ├── textures/moon/            # Tiled color + normal pyramids (L0..L3), height map
│   ├── textures/sky/             # Starfield
│   ├── models/                   # Optimized .glb files
│   ├── images/sites/<siteId>/    # then.webp, now.webp, gallery
│   └── audio/                    # narration/<lineId>.mp3, sfx, ambient
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # <Scene/> + <Hud/> layers
│   ├── index.css
│   ├── lib/
│   │   ├── geo.ts                # lat/lon ↔ Vector3, great-circle helpers
│   │   ├── constants.ts          # MOON_RADIUS_KM, scene scale, camera altitudes
│   │   └── quality.ts            # GPU/device capability → quality tier
│   ├── store/
│   │   └── useAppStore.ts        # Zustand: mode, selection, tour cursor, settings
│   ├── data/
│   │   ├── schema.ts             # Zod schemas + TS types
│   │   ├── sources.ts            # Citation registry (every fact points here)
│   │   ├── heroSites.ts
│   │   ├── secondarySites.ts
│   │   ├── tourChapters.ts
│   │   └── data.test.ts          # Validates all content
│   ├── scene/                    # Everything inside <Canvas>
│   │   ├── Scene.tsx
│   │   ├── moon/                 # MoonGlobe, MoonTile, tileManager, heightSampler
│   │   ├── Sun.tsx
│   │   ├── Starfield.tsx
│   │   ├── CameraRig.tsx
│   │   ├── markers/              # SiteMarkers, Marker, markerMaterial
│   │   └── LroOrbit.tsx          # (P1) Lo-Ro's orbit ring + glowing dot
│   ├── hud/                      # Everything in the DOM overlay
│   │   ├── Hud.tsx
│   │   ├── character/            # LoRo.tsx, DialogueBox.tsx, moods.ts
│   │   ├── intro/                # IntroScreen.tsx
│   │   ├── tour/                 # TourBar.tsx, ChapterCard.tsx
│   │   ├── explore/              # FilterBar.tsx, SiteIndex.tsx, SunControl.tsx
│   │   ├── story/                # SiteDrawer.tsx, ThenNowSlider.tsx, StatsGrid.tsx, MemoryLog.tsx, ModelSpotlight.tsx
│   │   ├── interactions/         # LaserRetroreflector.tsx, Moonquake.tsx, RoverLiftoffCam.tsx
│   │   └── credits/              # SourcesDrawer.tsx
│   ├── engine/
│   │   ├── tourEngine.ts         # Pure reducer: beats → next state (unit tested)
│   │   ├── useTourRunner.ts      # Hook that executes beat side effects
│   │   └── camera.ts             # Camera command bus (flyTo, orbitHome)
│   └── audio/
│       ├── AudioEngine.ts        # Web Audio buses, radio filter, Quindar synth
│       └── speech.ts             # Clip playback + Web Speech fallback
└── PROJECT_OVERVIEW.md
```

---

## 0.3 Coordinate & Unit Conventions (P0, everyone must follow)

| Thing | Convention |
| :-- | :-- |
| Latitude | Degrees, −90 (S) … +90 (N) |
| Longitude | Degrees, **east-positive**, −180 … +180 (convert 0–360 °E values: `lon > 180 ? lon - 360 : lon`) |
| Scene scale | Moon mean radius **1737.4 km = 1.0 scene unit** |
| Heights | LOLA heights in km ÷ 1737.4 × `HEIGHT_EXAGGERATION` (default 3) |
| Orientation | Lon 0°, lat 0° (sub-Earth point) faces **+X**. North pole is **+Y**. East longitudes go toward **−Z**, so east is on the right when viewed from +X, as seen from Earth. |
| Texture | Equirectangular maps centered on lon 0° (left edge = −180°), which is how the SVS CGI Moon Kit ships |

`src/lib/geo.ts`. This formula matches three.js `SphereGeometry` UVs, so markers land exactly on the texture:

```ts
import { Vector3 } from "three";

export const DEG = Math.PI / 180;

/** Planetocentric lat/lon (deg, east-positive) → scene position. */
export function latLonToVector3(lat: number, lon: number, radius = 1, out = new Vector3()) {
  const φ = lat * DEG;
  const λ = lon * DEG;
  return out.set(
    radius * Math.cos(φ) * Math.cos(λ),
    radius * Math.sin(φ),
    -radius * Math.cos(φ) * Math.sin(λ),
  );
}

export function vector3ToLatLon(v: Vector3) {
  const r = v.length();
  return { lat: Math.asin(v.y / r) / DEG, lon: Math.atan2(-v.z, v.x) / DEG };
}
```

- [ ] **P0** `src/lib/geo.test.ts`: round-trip tests; (0,0) → (1,0,0); (0,90) → (0,0,−1); (90,any) → (0,1,0).
- [ ] **P0** Visual check in Phase 1: an Apollo 11 marker (0.67°N, 23.47°E) must sit on the southwestern edge of Mare Tranquillitatis in the texture.

`src/lib/constants.ts`:

```ts
export const MOON_RADIUS_KM = 1737.4;
export const HEIGHT_EXAGGERATION = 3;
export const CAMERA = {
  homeDistance: 3.2,     // whole Moon in view
  minDistance: 1.02,     // closest zoom (≈35 km altitude)
  maxDistance: 8,
  siteAltitude: 0.12,    // ≈200 km above a site when "landed" on it
  flyDurationMs: 2800,
} as const;
```

---

## 0.4 UI Theme Tokens (P0)

Mission-HUD look: deep space background, warm "sunlit regolith" accent, cyan for Lo-Ro and data.

```css
@theme {
  --color-space-950: #05070d;
  --color-space-900: #0b1020;
  --color-regolith: #d9cbb0;
  --color-sunlit: #ffcf70;
  --color-loro: #5ce1ff;
  --color-alert: #ff6b5c;
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Category colors, used by markers, filter chips, and legend:

| Category | Color |
| :-- | :-- |
| `lander` (Landers & Descent Stages) | `#ffcf70` |
| `rover` (Lunar Rovers) | `#ff9f5c` |
| `experiment` (ALSEP / Science) | `#7ee787` |
| `active` (Still Active Today) | `#5ce1ff` |
| `impact` (Robotic Impacts / Probes) | `#c4a7ff` |
| `future` (Artemis) | `#ffffff`, pulsing ring |

---

## 0.5 Coding Rules

- Scene code (`src/scene`) never imports from `src/hud` and vice versa. They talk **only through the store** and `engine/camera.ts`.
- Content lives in `src/data`, never hard-coded in components. All user-facing strings for sites and the tour come from data files, so a translation (for example, Arabic) is possible later.
- No `any`. Data types are inferred from Zod schemas (`z.infer`).
- Dispose of three.js textures and geometries you create manually (tile manager!).
- Every PR: `npm run lint && npm test && npm run build` passes.

## 0.6 App Shell (P0)

`App.tsx` renders two stacked layers:

```tsx
export default function App() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-space-950 text-regolith">
      <Canvas
        className="absolute inset-0"
        camera={{ fov: 40, near: 0.001, far: 100, position: [3.2, 0.4, 0] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      <Hud /> {/* absolute inset-0 pointer-events-none; children opt back in */}
    </div>
  );
}
```

## Acceptance Criteria

- [ ] `npm run dev` shows a black canvas with a placeholder sphere and a HUD title.
- [ ] `npm test` runs `geo.test.ts` green.
- [ ] `npm run build` produces `dist/` with no TS errors.
