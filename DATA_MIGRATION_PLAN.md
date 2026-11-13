# Data Migration Plan — 2026 Resources Tab Alignment

> **Status:** PLAN ONLY — no code or data has been changed yet.
> **Branch:** `perf/top-tier-optimizations`
> **Source of truth:** [2026 Challenge — Resources tab](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources)

---

## 1. Decisions (confirmed with user)

| Question | Decision |
| :--- | :--- |
| World coverage | **Moon + Mars only** — remove the Earth/ISS globe and all Earth content |
| Pruning | **Strict** — only equipment named in the Resources tab |
| Content depth | **Full rewrite** — every hero intro, memory log, summary, stat and tour beat rewritten from NASA sources |

Consequence: **Dawn, NEAR Shoemaker, Pioneer 10/11 and Kepler are dropped** (they are deep-space objects, not on a Moon/Mars globe). Document this in the README so the omission is intentional.

---

## 2. What the Resources tab actually names

Extracted verbatim from the challenge page payload:

**The Moon**
- Apollo Lunar Modules — descent stages left as launch pads (`1969-059C`)
- Lunar Roving Vehicles (LRVs) (`1971-063C`)
- ALSEP scientific packages (`1969-099C`)
- Surveyor landers (`science.nasa.gov/mission/surveyor-3/`)

**Mars / "elsewhere"**
- Sojourner Rover (`mars-pathfinder`)
- Spirit & Opportunity (`mars-exploration-rovers-spirit-and-opportunity`)
- Viking 1 & 2 Landers (`viking-1`)
- Phoenix & InSight Landers (`insight`)
- Ingenuity (`mars-2020-perseverance/ingenuity-mars-helicopter`)
- ~~Dawn, NEAR Shoemaker, Pioneer 10 & 11, Kepler~~ → **out of scope** per decision

Shared backbone: `NSSDCA` master catalog (`https://nssdc.gsfc.nasa.gov/`).

---

## 3. Target catalog (31 sites)

### 3.1 Moon — 8 heroes

| id | Name | Object | Year | Lat | Lon | NSSDCA | Image folder |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |
| `surveyor-1` | Surveyor 1: First Soft Landing | Surveyor lander | 1966 | -2.4745 | -43.3398 | 1966-045A | `surveyor-1` |
| `apollo-11` | Tranquility Base: Eagle's Descent Stage | LM descent stage | 1969 | 0.6742 | 23.4731 | 1969-059C | `apollo-11` |
| `apollo-12` | Intrepid: Pinpoint Landing at Surveyor 3 | LM descent stage | 1969 | -3.0162 | -23.418 | 1969-099C | `apollo-12-surveyor-3` |
| `apollo-14` | Antares: Landing at Fra Mauro | LM descent stage | 1971 | -3.6442 | -17.4777 | 1971-008C | `apollo-14-alsep` |
| `apollo-15` | Falcon: Hadley Rille Landing | LM descent stage | 1971 | 26.1324 | 3.6333 | 1971-063C | `apollo-15-lrv` |
| `apollo-16` | Orion: Descartes Highlands Landing | LM descent stage | 1972 | -8.9734 | 15.5011 | 1972-031C | `apollo-16-descartes` |
| `apollo-17` | Challenger: Taurus–Littrow Landing | LM descent stage | 1972 | 20.1911 | 30.7723 | 1972-096C | `apollo-17-lrv` |
| `surveyor-7` | Surveyor 7: Sentinel at Tycho | Surveyor lander | 1968 | -40.9812 | -11.5127 | 1968-001A | `surveyor-7` |

### 3.2 Moon — 12 secondaries

| id | Name | Object | Year | Lat | Lon | Parent hero | Image folder |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |
| `surveyor-3` | Surveyor 3: The Visited Robot | Surveyor lander | 1967 | -2.99 | -23.34 | `apollo-12` | `apollo-12-surveyor-3` |
| `surveyor-5` | Surveyor 5: Alpha-Scattering Chemist | Surveyor lander | 1967 | 1.4551 | 23.1943 | — | `surveyor-5` |
| `surveyor-6` | Surveyor 6: The First Lunar Hop | Surveyor lander | 1967 | 0.4742 | -1.4275 | — | `surveyor-6` |
| `apollo-11-easep` | Apollo 11 EASEP Package | Early ALSEP | 1969 | 0.6739 | 23.4728 | `apollo-11` | `apollo-11` |
| `apollo-12-alsep` | Apollo 12 ALSEP Station | ALSEP | 1969 | -3.0098 | -23.4249 | `apollo-12` | `apollo-12-alsep` |
| `apollo-14-alsep` | Apollo 14 ALSEP & Retroreflector | ALSEP | 1971 | -3.645 | -17.480 | `apollo-14` | `apollo-14-alsep` |
| `apollo-15-alsep` | Apollo 15 ALSEP Station | ALSEP | 1971 | 26.134 | 3.630 | `apollo-15` | `apollo-15-lrrr` |
| `apollo-15-lrv` | LRV-1: The First Moon Buggy | LRV | 1971 | 26.1322 | 3.6330 | `apollo-15` | `apollo-15-lrv` |
| `apollo-16-alsep` | Apollo 16 ALSEP Station | ALSEP | 1972 | -8.975 | 15.503 | `apollo-16` | `apollo-16-descartes` |
| `apollo-16-lrv` | LRV-2: The Highland Rover | LRV | 1972 | -8.972 | 15.499 | `apollo-16` | `apollo-16-descartes` |
| `apollo-17-alsep` | Apollo 17 ALSEP Station | ALSEP | 1972 | 20.1923 | 30.7655 | `apollo-17` | `apollo-17-alsep` |
| `apollo-17-lrv` | LRV-3: The Last Moon Buggy | LRV | 1972 | 20.190 | 30.775 | `apollo-17` | `apollo-17-lrv` |

**Coverage check:** 6 LM descent stages · 3 LRVs · 6 ALSEP/EASEP packages · 5 Surveyor landers (1, 3, 5, 6, 7).

> Assumption: Surveyor 2 and Surveyor 4 crashed/failed and never achieved a soft landing, so they are excluded from the "Surveyor landers" story. They can be mentioned inside the Surveyor 1 hero narrative instead of receiving markers.

### 3.3 Mars — 8 heroes

| id | Name | Object | Year | Lat | Lon | NSSDCA | Image folder |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |
| `viking-1` | Viking 1: Mutch Memorial Station | Lander | 1976 | 22.697 | -48.222 | 1975-075C | `viking-1` |
| `viking-2` | Viking 2: Soffen Memorial Station | Lander | 1976 | 47.968 | 134.28 | 1975-083C | `viking-2` |
| `mars-pathfinder` | Pathfinder: Carl Sagan Memorial Station | Lander | 1997 | 19.13 | -33.22 | 1996-068A | `mars-pathfinder` |
| `spirit-rover` | Spirit: Troy Sand Trap | Rover | 2004 | -14.5684 | 175.4726 | 2003-027A | `spirit-rover` |
| `opportunity-rover` | Opportunity: Perseverance Valley | Rover | 2004 | -2.28 | -5.42 | 2003-032A | `opportunity-rover` |
| `phoenix-lander` | Phoenix: Polar Water-Ice Digger | Lander | 2008 | 68.2188 | -125.7492 | 2007-034A | `phoenix-lander` |
| `insight-lander` | InSight: Marsquake Listener | Lander | 2018 | 4.5024 | 135.6234 | 2018-042A | `insight-lander` |
| `ingenuity-helicopter` | Ingenuity: Valinor Hills | Helicopter | 2021 | 18.497 | 77.311 | 2020-052B | `ingenuity-helicopter` |

### 3.4 Mars — 3 secondaries

| id | Name | Object | Year | Lat | Lon | Parent hero | Image folder |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |
| `sojourner-rover` | Sojourner: The First Mars Rover | Microrover | 1997 | 19.13 | -33.22 | `mars-pathfinder` | `mars-pathfinder` |
| `spirit-lander` | Columbia Memorial Station | Lander platform | 2004 | -14.5692 | 175.4729 | `spirit-rover` | `spirit-lander` |
| `opportunity-lander` | Challenger Memorial Station | Lander platform | 2004 | -1.9462 | -5.5268 | `opportunity-rover` | `opportunity-eagle-lander` |

**Grand total: 20 Moon + 11 Mars = 31 sites.**

### 3.5 Sites to delete

Entire **Earth** catalog (`earthHeroSites`, `earthSecondarySites`, `earthTourChapters`) and these Moon/Mars missions that are **not** in the Resources tab:

`ranger-6/7/8/9`, `lunar-orbiter-1`, `apollo-13-sivb`, `apollo-14-sivb`, `apollo-15-sivb`, `apollo-14-lrrr`, `apollo-15-lrrr`, `lunar-prospector`, `grail-ebb`, `grail-flow`, `ladee`, `odysseus-im1`, `artemis-south-pole`, `curiosity-rover`, `perseverance-rover`, `viking-1-backshell`, `mars-polar-lander`, `opportunity-heat-shield`, `curiosity-bradbury-landing`, `curiosity-sky-crane`, `perseverance-sky-crane`, `perseverance-parachute-backshell`, `wright-brothers-field`, `three-forks-depot`, `beagle-2`, `mars-3-lander`, `schiaparelli-edm`, `phoenix-heat-shield`, `insight-heat-shield`, `mars-2-impact`, `mars-6-lander`, `zhurong-rover`.

> Note: `apollo-14-lrrr` / `apollo-15-lrrr` are folded into their mission's ALSEP secondary card rather than kept as separate markers, to avoid marker pile-ups. Retroreflector science is still fully narrated in the Apollo 11 and Apollo 14/15 cards.

---

## 4. Sources ledger rewrite (`src/data/sources.ts`)

Keep only sources that back the resource list plus the globe/imagery substrate.

### Moon
- `S-SVS-4720` — CGI Moon Kit (globe)
- `S-WAGNER-2017` — LROC anthropogenic coordinates
- `S-LROC-FEATURED` — LROC NAC hardware imagery
- `S-NSSDCA-MOON` — NSSDCA lunar master catalog
- `S-NSSDCA-1966-045A` — Surveyor 1
- `S-NSSDCA-1967-035A` — Surveyor 3
- `S-NSSDCA-1967-084A` — Surveyor 5
- `S-NSSDCA-1967-112A` — Surveyor 6
- `S-NSSDCA-1968-001A` — Surveyor 7
- `S-NSSDCA-1969-059C` — Apollo 11 LM / EASEP
- `S-NSSDCA-1969-099C` — Apollo 12 LM / ALSEP
- `S-NSSDCA-1971-008C` — Apollo 14 LM / ALSEP
- `S-NSSDCA-1971-063C` — Apollo 15 LM / LRV-1 / ALSEP
- `S-NSSDCA-1972-031C` — Apollo 16 LM / LRV-2 / ALSEP
- `S-NSSDCA-1972-096C` — Apollo 17 LM / LRV-3 / ALSEP
- `S-ALSEP-ARCHIVE` — PDS ALSEP seismic archive
- `S-LLR-SCIENCE` — Lunar Laser Ranging (retroreflectors)
- `S-NASA-SURVEYOR-3` — `science.nasa.gov/mission/surveyor-3/`
- `S-3D-LM`, `S-3D-LRV`, `S-3D-SURVEYOR`, `S-IVL-ARCHIVE`

### Mars
- `S-MOLA-MEGDR`, `S-HIRISE-HARDWARE`, `S-SVS-4851`
- `S-NSSDCA-MARS`
- `S-NSSDCA-1975-075C` — Viking 1
- `S-NSSDCA-1975-083C` — Viking 2
- `S-NSSDCA-1996-068A` — Pathfinder / Sojourner
- `S-NSSDCA-2003-027A` — Spirit
- `S-NSSDCA-2003-032A` — Opportunity
- `S-NSSDCA-2007-034A` — Phoenix
- `S-NSSDCA-2018-042A` — InSight
- `S-NSSDCA-2020-052B` — Ingenuity
- `S-NASA-VIKING`, `S-NASA-PATHFINDER`, `S-NASA-MER`, `S-NASA-INSIGHT`, `S-NASA-INGENUITY`
- `S-3D-MARS-ROVER`

### Delete
All Earth sources (`S-BLUE-MARBLE`, `S-NASA-KSC`, `S-NASA-JSC`, `S-NASA-JPL`, `S-NASA-DSN`, `S-NASA-ISS`, `S-ESA-CSG`, `S-ISRO-SDSC`, `S-GLOBAL-SPACEPORTS`) and non-resource mission sources (`S-NSSDCA-1964-041A`, `S-NSSDCA-2009-031B`, `S-NSSDCA-2011-070A`, `S-NSSDCA-2020-052A`).

---

## 5. Narrative rewrite spec

Every hero site must ship:
- `subtitle` — one hook line, ≤ 90 chars.
- `summary` — 2–3 sentences, kid-friendly, explains *why* the object was left behind.
- `hardwareLeftBehind` — 3+ concrete items.
- `stats` — 4 verified facts, each with a `sourceIds`.
- `loroIntro` — Lo-Ro in-orbit narration, ≤ 300 chars.
- `memoryLog` — first-person equipment diary, ≤ 320 chars.
- `scienceImpact` — the discovery the abandoned hardware enabled.
- `artemisLink` — one sentence connecting to future exploration.
- `archivePlate` — caption + year.
- `sourceIds` — 3+ valid ledger IDs.

Secondary sites ship: `subtitle`, `summary`, 2+ stats, `hardwareLeftBehind`, 1+ sources.

**Tone:** warm, wonder-first, present tense, no jargon dumps. Keep the existing "the machine remembers" voice that makes the project distinctive.

Facts to verify against NSSDCA / science.nasa.gov before writing:
- Desk masses, landing dates, exact coordinates, operational end dates.
- ALSEP station lifetimes and instrument lists.
- LRV distances driven (Apollo 15: 27.8 km; 16: 26.7 km; 17: 35.7 km).
- Surveyor touchdown masses and site names.
- Mars lander/rover end-of-mission dates and distances.

---

## 6. Guided tour rewrite

### Moon — 5 chapters
1. **The Robot Scouts** — `surveyor-1`, `surveyor-7` (mention Surveyor 3 in narration)
2. **Eagle's Base** — `apollo-11` (+ EASEP secondary)
3. **Old Friends & Moonquakes** — `apollo-12`, `apollo-14`
4. **Parked Moon Buggies** — `apollo-15`, `apollo-16`, `apollo-17` (+ LRV secondaries)
5. **Still Answering Earth** — `apollo-11`, `apollo-14`, `apollo-15` (retroreflector chain)

### Mars — 5 chapters
1. **The First Landers** — `viking-1`, `viking-2`
2. **A Microrover's First Drive** — `mars-pathfinder` (+ `sojourner-rover`)
3. **Twin Marathon Rovers** — `spirit-rover`, `opportunity-rover`
4. **Poles and Marsquakes** — `phoenix-lander`, `insight-lander`
5. **Flying on Another World** — `ingenuity-helicopter`

All `flySite` beats must reference existing hero IDs; all `speak` lines get unique IDs.

---

## 7. Code changes

### 7.1 Delete files
```
src/data/earthHeroSites.ts
src/data/earthSecondarySites.ts
src/data/earthTourChapters.ts
src/hud/earth/IssDrawer.tsx
src/lib/issTracker.ts
src/lib/issTracker.test.ts
src/scene/earth/EarthGlobe.tsx
src/scene/earth/IssOrbit.tsx
src/scene/earth/BackgroundMoon.tsx
```

> `src/scene/Earth.tsx` is the **Earth in the lunar sky** (not the Earth globe) and is kept.

### 7.2 Rewrite / edit
| File | Change |
| :--- | :--- |
| `src/data/schema.ts` | `CelestialBodySchema = z.enum(["moon","mars"])` |
| `src/data/heroSites.ts` | 8 new Moon heroes |
| `src/data/secondarySites.ts` | 12 new Moon secondaries |
| `src/data/marsHeroSites.ts` | 8 new Mars heroes |
| `src/data/marsSecondarySites.ts` | 3 new Mars secondaries |
| `src/data/tourChapters.ts` | 5 new Moon chapters |
| `src/data/marsTourChapters.ts` | 5 new Mars chapters |
| `src/data/sources.ts` | new ledger (Section 4) |
| `src/data/index.ts` | drop Earth exports/aliases; keep `MOON_SITES`, `MARS_SITES`, `SITE_BY_ID`, body helpers |
| `src/lib/constants.ts` | delete `EARTH_CATEGORY_META`; `getCategoryMeta(body: "moon"\|"mars")` |
| `src/store/useAppStore.ts` | remove `earth` branches, `issPanelOpen`, earth dialogue |
| `src/hud/Hud.tsx` | remove Earth button, ISS button, Earth tips, `IssDrawer` |
| `src/hud/intro/IntroScreen.tsx` | remove Earth mode copy/branch |
| `src/hud/character/DialogueBox.tsx` | remove Earth fallback/branch |
| `src/hud/credits/SourcesDrawer.tsx` | remove Earth source group + body link |
| `src/scene/Scene.tsx` | Moon/Mars only; drop `EarthGlobe`, `IssOrbit`, `BackgroundMoon` |
| `src/scene/moon/heightSampler.ts` | drop Earth DEM entry/branches |
| `src/scene/moon/tileManager.ts` | drop `earthTileManager` |
| `src/scene/moon/createTileGeometry.ts` | drop Earth branches |
| `src/scene/CameraRig.tsx` | drop Earth surface-radius branch |
| `src/scene/LunarHorizonGlow.tsx` | Moon/Mars only |
| `src/engine/useTourRunner.ts` | drop Earth branch |
| `src/lib/quality.ts` | drop Earth budgets |
| `scripts/generate-narration.mjs` | remove Earth file list entries |
| `README.md`, `PROJECT_OVERVIEW.md`, `AGENTS.md` | Moon + Mars scope; document excluded extras |

### 7.3 Tests
- `src/data/data.test.ts`
  - Counts become **8 Moon heroes / 12 Moon secondaries / 8 Mars heroes / 3 Mars secondaries**.
  - Remove Earth assertions and `ALL_EARTH_SITES`.
  - Keep geographic quadrant checks (`apollo-11`, `surveyor-1`), retarget `ladee` check to `surveyor-7` or drop.
  - Keep image-file existence checks.
- `src/data/content.test.ts`
  - Update counts and `EVERY_PLANETARY_SITE.length === 31`.
  - Remove Earth imports/assertions.
  - Update `SOURCES.length` floor.
- `src/engine/tourEngine.test.ts` — verify IDs still resolve; no Earth references.

---

## 8. Assets & audio

- **Images:** reuse existing local folders per the tables above. No new downloads required. Optional polish: fetch dedicated NASA imagery for `apollo-15`/`apollo-16` LM descent stages, but not blocking.
- **Narration:** `edge-tts` + `ffmpeg` are installed. After the rewrite, run `bun run assets:narration` to regenerate MP3s for all new dialogue IDs. Stale Earth/removed-mission MP3s will be deleted from `public/audio/narration/`.
- **Unused Earth assets:** delete `public/textures/earth/` and Earth-only site image folders **only after** tests/build pass (optional slimming step).

---

## 9. Execution order

1. Remove Earth code paths + delete files; update schema/index/constants/store.
2. Rewrite `sources.ts`.
3. Rewrite Moon hero + secondary data.
4. Rewrite Mars hero + secondary data.
5. Rewrite both tour chapter files.
6. Update HUD/scene/intro/dialogue/credits for two bodies.
7. Update tests and docs.
8. Regenerate narration.
9. Run the full gate.

---

## 10. Verification gate

```bash
bun run lint
bun run check
bun test
bun run build
```

Definition of done:
- No `earth` references remain in `src/` except the lunar-sky `src/scene/Earth.tsx`.
- No removed mission IDs remain in data or tests.
- Every site passes `SiteSchema`; every `sourceIds` entry resolves in `SOURCES_BY_ID`.
- Every referenced thumbnail/archive image exists on disk.
- Torch rest of repo for dead imports (`SITE_BY_ID`, `getSitesForBody`, etc.).
- README/AGENTS/PROJECT_OVERVIEW describe Moon + Mars and explain the deliberate exclusions.

---

## 11. Risks & assumptions

| Risk | Mitigation |
| :--- | :--- |
| Removing Earth breaks persisted Zustand state for returning users | `celestialBody` defaults to `"moon"`; add a guard in the persist merge if needed |
| Tour/narration IDs churn leaves stale audio | Regenerate via `assets:narration`; runtime falls back to Web Speech |
| Overlapping markers at the same landing site | Offset secondary coords by ~0.002° and use `parentHeroId` |
| "Strict" pruning removes audience favourites (Curiosity, Perseverance) | Called out explicitly in README; can be re-added later as a "Beyond the brief" toggle |
| Historical facts drift | Every stat cites NSSDCA/science.nasa.gov; content tests enforce the citation ledger |
