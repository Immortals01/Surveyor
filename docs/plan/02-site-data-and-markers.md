# Phase 2 — Site Data, Surface Markers & Explore Filters

**Goal:** Define the typed, citation-backed NASA lunar hardware dataset, place clickable 3D beacons accurately on the displaced lunar surface, and provide fast filtering and site lookup for Free Explore mode.

**Estimated effort:** 1–1.5 days. The P0 subset takes about 5 hours.

**Depends on:** Phase 0 (`geo.ts`, `constants.ts`), Phase 1 (`heightSampler.ts`, `CameraRig.tsx`).

---

## 2.1 Data Schema: `src/data/schema.ts` (P0)

All content is validated at test and build time with **Zod**. Components infer types directly via `z.infer`, keeping `src/scene` and `src/hud` decoupled.

```ts
import { z } from "zod";

export const CategorySchema = z.enum([
  "lander",      // Landers & Descent Stages
  "rover",       // Lunar Roving Vehicles
  "experiment",  // ALSEP & Surface Science Packages
  "active",      // Passive hardware still used today (retroreflectors)
  "impact",      // Intentional probes, boosters & orbital impactors
  "future",      // Upcoming Artemis frontier context
]);
export type Category = z.infer<typeof CategorySchema>;

export const WidgetKindSchema = z.enum([
  "laser-retroreflector",
  "moonquake",
  "rover-liftoff-cam",
]);
export type WidgetKind = z.infer<typeof WidgetKindSchema>;

export const SourceEntrySchema = z.object({
  id: z.string().regex(/^S-[A-Z0-9-]+$/),
  title: z.string(),
  agencyOrAuthor: z.string(),
  dataset: z.enum(["SVS", "LROC", "NSSDCA", "ALSEP", "NASA-3D", "NASA-IVL", "LITERATURE"]),
  url: z.string().url(),
  creditLine: z.string(),
});

export const StatItemSchema = z.object({
  label: z.string(),           // e.g. "Mass Left Behind"
  value: z.string(),           // e.g. "2,130 kg"
  sourceIds: z.array(z.string()).min(1),
});

export const DialogueLineSchema = z.object({
  id: z.string(),              // maps to /audio/narration/<id>.mp3 when present
  speaker: z.enum(["loro", "equipment"]),
  speakerLabel: z.string().optional(), // e.g. "LRV-3 // Taurus-Littrow (1972)"
  mood: z.enum(["waving", "scanning", "narrating", "nostalgic", "excited"]).default("narrating"),
  text: z.string().max(340),
  sourceIds: z.array(z.string()).default([]),
});

export const BaseSiteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  tier: z.enum(["hero", "secondary"]),
  name: z.string(),
  subtitle: z.string(),
  mission: z.string(),
  nssdcaId: z.string(),        // e.g. "1969-059C" or "TBD-ARTEMIS-III"
  year: z.number().int().min(1959).max(2035),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180), // east-positive!
  region: z.string(),          // e.g. "Mare Tranquillitatis"
  primaryCategory: CategorySchema,
  categories: z.array(CategorySchema).min(1),
  summary: z.string(),
  hardwareLeftBehind: z.array(z.string()).min(1),
  stats: z.array(StatItemSchema).min(2),
  thumbnailImage: z.string(),  // /images/sites/<id>/thumb.webp
  sourceIds: z.array(z.string()).min(1),
});

export const HeroSiteSchema = BaseSiteSchema.extend({
  tier: z.literal("hero"),
  loroIntro: DialogueLineSchema,
  memoryLog: DialogueLineSchema, // speaker: "equipment"
  scienceImpact: z.string(),
  artemisLink: z.string(),
  thenNow: z.object({
    thenImage: z.string(),
    thenCaption: z.string(),
    thenYear: z.number().int(),
    nowImage: z.string(),
    nowCaption: z.string(),
    lrocImageId: z.string(),     // e.g. "M175124932R"
    hotspots: z.array(
      z.object({
        xPct: z.number().min(0).max(100),
        yPct: z.number().min(0).max(100),
        label: z.string(),
      }),
    ).default([]),
  }),
  model3d: z
    .object({
      glbPath: z.string(),
      title: z.string(),
      scale: z.number().positive().default(1),
      sourceId: z.string(),
    })
    .optional(),
  widget: WidgetKindSchema.optional(),
  closeUpPatch: z
    .object({
      imagePath: z.string(),
      widthPx: z.number().positive(),
      metersPerPixel: z.number().positive(),
    })
    .optional(),
});

export const SecondarySiteSchema = BaseSiteSchema.extend({
  tier: z.literal("secondary"),
});

export const SiteSchema = z.discriminatedUnion("tier", [
  HeroSiteSchema,
  SecondarySiteSchema,
]);
export type HeroSite = z.infer<typeof HeroSiteSchema>;
export type SecondarySite = z.infer<typeof SecondarySiteSchema>;
export type LunarSite = z.infer<typeof SiteSchema>;
```

Helper in `src/data/index.ts`:
- `ALL_SITES: LunarSite[]` (merged `HERO_SITES` + `SECONDARY_SITES`)
- `SITE_BY_ID: ReadonlyMap<string, LunarSite>`
- `isNearside(lon: number): boolean => Math.abs(lon) <= 90`

---

## 2.2 Verified Seed List: `heroSites.ts` & `secondarySites.ts` (P0)

Coordinates use the **LROC planetocentric Mean Earth/Polar Axis frame** (Wagner et al., *Icarus*, 2017), converted to `[-180, +180]` east-positive degrees so they align directly with `latLonToVector3` from Phase 0.

### The 9 Hero Sites (`src/data/heroSites.ts`)

Every hero site occupies a **distinct geographic location** (no overlapping globe markers), spans all 6 categories, powers the 5 Guided Tour chapters, and anchors the 3 science widgets:

| # | `id` | Display Name | Lat (°N) | Lon (°E) | Primary Cat | NSSDCA ID | Widget / Model | Tour Ch. |
| :-- | :-- | :-- | --: | --: | :-- | :-- | :-- | :-- |
| 1 | `ranger-7` | Ranger 7 Impact Site | `-10.6340` | `-20.6770` | `impact` | `1964-041A` | — | Ch. 1 |
| 2 | `surveyor-1` | Surveyor 1 Lander | `-2.4745` | `-43.3398` | `lander` | `1966-045A` | `surveyor.glb` | Ch. 1 |
| 3 | `apollo-11` | Tranquility Base (*Eagle* & LRRR) | `0.6742` | `23.4731` | `active` | `1969-059C` | `laser-retroreflector` + `apollo-lm.glb` | Ch. 2 & 5 |
| 4 | `apollo-12-surveyor-3` | *Intrepid* & Surveyor 3 Neighbors | `-3.0162` | `-23.4180` | `lander` | `1967-035A` | `surveyor.glb` | Ch. 3 |
| 5 | `apollo-14-alsep` | Apollo 14 ALSEP Seismic Station | `-3.6442` | `-17.4777` | `experiment` | `1971-008C` | `moonquake` | Ch. 3 |
| 6 | `apollo-15-lrv` | Apollo 15 Rover (LRV-1) & *Falcon* | `26.1324` | `3.6333` | `rover` | `1971-063C` | `apollo-lrv.glb` | Ch. 4 |
| 7 | `apollo-16-descartes` | Apollo 16 *Orion* & UV Observatory | `-8.9734` | `15.5011` | `experiment` | `1972-031C` | `apollo-lm.glb` | Ch. 4 |
| 8 | `apollo-17-lrv` | Apollo 17 Rover (LRV-3) & TV Cam | `20.1911` | `30.7723` | `rover` | `1972-096C` | `rover-liftoff-cam` + `apollo-lrv.glb` | Ch. 4 |
| 9 | `artemis-south-pole` | LCROSS & The Artemis South Pole | `-84.6780` | `-48.6937` | `future` | `2009-031B` | — | Ch. 5 |

> [!TIP]
> Notice `apollo-11` has `primaryCategory: "active"` and `categories: ["active", "lander", "experiment"]`, so it highlights whether the user filters by *Still Active Today*, *Landers*, or *Science*.

### Secondary Sites Seed (`src/data/secondarySites.ts` — ≥ 12 for P0, 20+ for P1)

Include a representative cross-section across nearside, poles, and farside:

| `id` | Name | Lat (°N) | Lon (°E) | Category | Note | Priority |
| :-- | :-- | --: | --: | :-- | :-- | :-- |
| `ranger-6` | Ranger 6 | `9.3864` | `21.4806` | `impact` | Mare Tranquillitatis impact (TV failed) | P1 |
| `ranger-8` | Ranger 8 | `2.6377` | `24.7881` | `impact` | 7,137 photos before Mare Tranquillitatis impact | P0 |
| `ranger-9` | Ranger 9 | `-12.8281` | `-2.3884` | `impact` | Live broadcast dive into Alphonsus crater | P0 |
| `surveyor-2` | Surveyor 2 | `4.0` | `-11.0` | `impact` | Tumbled near Copernicus crater (approx.) | P2 |
| `surveyor-5` | Surveyor 5 | `1.4551` | `23.1943` | `lander` | First alpha-scattering soil chemistry test | P0 |
| `surveyor-6` | Surveyor 6 | `0.4742` | `-1.4275` | `lander` | First rocket-powered hop from lunar surface | P0 |
| `surveyor-7` | Surveyor 7 | `-40.9812` | `-11.5127` | `lander` | Rim of Tycho crater; spotted Earth laser beams | P0 |
| `lunar-orbiter-1` | Lunar Orbiter 1 Impact | `6.35` | `160.72` | `impact` | **Farside** intentional de-orbit | P1 |
| `apollo-13-sivb` | Apollo 13 S-IVB Booster Crater | `-2.5550` | `-27.8875` | `impact` | Calibrated Apollo 12 seismometer | P0 |
| `apollo-14-sivb` | Apollo 14 S-IVB Booster Crater | `-8.0905` | `-26.0173` | `impact` | Artificial seismic wave source | P1 |
| `apollo-15-sivb` | Apollo 15 S-IVB Booster Crater | `-1.3582` | `-11.8145` | `impact` | Artificial seismic wave source | P1 |
| `apollo-15-lrrr` | Apollo 15 Retroreflector (300-prism) | `26.1334` | `3.6284` | `active` | Largest passive mirror array on the Moon | P0 |
| `apollo-14-lrrr` | Apollo 14 Retroreflector | `-3.6442` | `-17.4786` | `active` | Still ranged by Apache Point & Grasse | P1 |
| `apollo-12-alsep` | Apollo 12 ALSEP Station | `-3.0098` | `-23.4249` | `experiment` | First long-lived nuclear-powered ALSEP | P1 |
| `apollo-17-alsep` | Apollo 17 ALSEP & Gravimeter | `20.1923` | `30.7655` | `experiment` | Deepest lunar core & heat-flow probes | P0 |
| `lunar-prospector` | Lunar Prospector Shoemaker Impact | `-87.7` | `42.1` | `impact` | South polar hydrogen/water-ice scout (1999) | P0 |
| `grail-ebb` | GRAIL-A (*Ebb*) Impact Site | `75.6083` | `33.4043` | `impact` | Sally K. Ride Impact Site (gravity mapper) | P0 |
| `grail-flow` | GRAIL-B (*Flow*) Impact Site | `75.6230` | `33.3220` | `impact` | Paired gravity mapper twin | P1 |
| `ladee` | LADEE Farside Impact | `11.8494` | `-93.2493` | `impact` | **Eastern limb/farside** dust & exosphere probe | P0 |
| `odysseus-im1` | *Odysseus* (IM-1 / NASA CLPS) | `-80.1278` | `1.4413` | `lander` | Malapert A; 6 NASA payloads + passive laser array (2024) | P0 |

---

## 2.3 Content Validation Tests: `src/data/data.test.ts` (P0)

Run via `npm test` and `npm run content:check`:

- [ ] **P0** Parse every item in `HERO_SITES` and `SECONDARY_SITES` against `SiteSchema`.
- [ ] **P0** Assert all `site.id` and `dialogueLine.id` values are globally unique.
- [ ] **P0** Assert every `sourceId` referenced in `site.sourceIds`, `stats[].sourceIds`, `loroIntro.sourceIds`, and `model3d.sourceId` exists in `SOURCES_BY_ID` (`src/data/sources.ts`).
- [ ] **P0** Assert every referenced public asset (`thumbnailImage`, `thenImage`, `nowImage`, `glbPath`) starts with `/` and exists under `public/` (allow placeholder SVG/WebP stubs in Phase 2 until final assets land in Doc 6).
- [ ] **P0** Sanity-check coordinate orientation: `apollo-11` maps to `+X, +Y, -Z` quadrant (`x > 0.8, y > 0, z < 0`).

---

## 2.4 3D Surface Markers: `src/scene/markers/` (P0)

### Positioning & Surface Alignment
- Compute surface position once height data is ready:
  ```ts
  const r = surfaceRadius(site.lat, site.lon) + MARKER_SURFACE_LIFT; // +0.002 units
  const pos = latLonToVector3(site.lat, site.lon, r);
  const normal = surfaceNormal(site.lat, site.lon);
  ```
- Before `height_1440x720.u16` finishes loading (~150 ms), fall back to `r = 1.002` and `normal = pos.clone().normalize()`, then snap smoothly when height samples arrive.

### Constant Screen-Space Scale (`Marker.tsx`)
Markers on a unit sphere either disappear when zoomed out (`d = 3.2`) or swallow whole craters when zoomed in (`d = 1.12`). Inside `useFrame`:

```ts
const camDist = camera.position.distanceTo(worldPos);
const angularScale = clamp(camDist * 0.018, 0.0018, 0.065);
groupRef.current.scale.setScalar(angularScale * (site.tier === "hero" ? 1.35 : 0.75));
```

### Visual Design (`markerMaterial.ts`)
- **Hero Marker:**
  - Crisp emissive center disc (`toneMapped: false`) colored by `primaryCategory` token from Phase 0.
  - Animated outer pulse ring (`uTime` uniform in a tiny `ShaderMaterial` or scaled ring mesh; disabled when `reduceMotion` is on).
  - Thin vertical stem connecting the beacon down to the regolith when zoomed close (`camDist < 0.8`).
- **Secondary Marker:**
  - Compact diamond/circle pip at 75% scale, no idle pulse ring (pulses only on hover/selection) so the near side stays clean and readable.
- **Selected State:**
  - Rotating target reticle ring around the selected marker.
- **Filtered-Out State:**
  - Animate opacity down to `0.08` and disable raycast (`raycast={() => null}`) rather than unmounting, keeping transitions smooth.

### Horizon & Occlusion Handling
- Even with depth testing against the Moon mesh, halo rings slightly above the surface can peek around the limb.
- Compute `horizonDot = normal.dot(toCameraDir)`. Fade marker opacity smoothly between `horizonDot = -0.02` (hidden) and `+0.08` (visible), and skip pointer picking when `horizonDot < 0`.

---

## 2.5 Picking, Hover Labels & Clustering (P0 / P1)

- [ ] **P0 Hit target:** Attach pointer events (`onPointerOver`, `onPointerOut`, `onClick`) to an invisible `<mesh>` sphere 2.4× larger than the visible dot so touch and trackpad users never struggle to click small dots.
- [ ] **P0 Click vs. drag guard:** Ignore `onClick` if pointer moved `> 5 px` between `pointerDown` and `pointerUp` (prevents accidental site selection while spinning the Moon).
- [ ] **P0 Single active label (`HoveredMarkerLabel.tsx`):** Render `<Html center distanceFactor={...}>` **only** for `hoveredSiteId` and `selectedSiteId` (max 2 DOM nodes at once—never mount 30 `<Html>` portals simultaneously). Show site name, year, and category badge.
- [ ] **P1 Close-pair de-clutter:** `apollo-12-surveyor-3` and `apollo-12-alsep` (or `apollo-15-lrv` and `apollo-15-lrrr`) sit within `< 0.01°` (~300 m). When `camDist > 0.35`, hide secondary sub-markers whose parent site is < 1.5° away; reveal them automatically as the user zooms into the landing region!

---

## 2.6 Explore Controls: `src/hud/explore/` (P0 / P1)

Rendered when `mode === "explore"` (hidden during `intro`; collapsed during `tour`):

- [ ] **P0 `FilterBar.tsx`:**
  - Horizontal pill bar at top-center/bottom-left: **All**, **Landers**, **Rovers**, **Science**, **Still Active**, **Impacts**, **Artemis**, plus a **"9 Hero Stories Only"** toggle.
  - Shows live count badge (`Showing 9 of 29 sites`).
- [ ] **P0 `SiteIndex.tsx`:**
  - Collapsible "All Hardware" list button opening a compact searchable list grouped by mission/era.
  - Clicking any row calls `selectSite(site.id)` + `cameraBus.flyToSite(site.id)`.
  - **Accessibility win:** gives keyboard-only and screen-reader users 100% parity with 3D globe clicking.
- [ ] **P1 Nearside / Farside / South Pole Quick-Jump:**
  - Quick camera preset chips (`Near Side`, `Far Side`, `South Pole`) so kids discover `ladee` and `lunar-orbiter-1` on the farside and `artemis-south-pole` at `85°S`.

---

## Acceptance Criteria

- [ ] **P0:** `npm run content:check` passes with 9 hero sites and ≥ 12 secondary sites, zero broken `sourceIds`.
- [ ] **P0:** Apollo 11 (`0.67°N, 23.47°E`) visibly sits on SW Mare Tranquillitatis; Surveyor 7 (`-40.98°N, -11.51°E`) sits right on the north rim of Tycho crater; Apollo 15 (`26.13°N, 3.63°E`) sits beside Montes Apenninus.
- [ ] **P0:** Dragging to rotate the globe never accidentally opens a site; clicking a marker smoothly flies to it and sets `selectedSiteId`.
- [ ] **P0:** Filtering by "Still Active" highlights `apollo-11` (and `apollo-15-lrrr` / `apollo-14-lrrr`) while dimming everything else and disabling clicks on dimmed dots.
- [ ] **P1:** Sub-markers (`apollo-15-lrrr` next to `apollo-15-lrv`) stay tucked away at full-globe view and separate cleanly when zoomed in.

## Risks & Mitigations

| Risk | Mitigation |
| :-- | :-- |
| East vs. West longitude sign mix-up puts Oceanus Procellarum sites in Mare Crisium | Enforce east-positive comment + unit test checking `surveyor-1` (`lon = -43.34`) lands in `+X, +Z` (left side of nearside from Earth) |
| Too many `<Html>` labels tank DOM layout every frame | Mount `<Html>` strictly for `hoveredSiteId` and `selectedSiteId` (≤ 2 nodes total) |
| Markers clip into displaced mountains | Sample `surfaceRadius(lat, lon)` at exact marker coordinates and add `+0.002` normal offset |
