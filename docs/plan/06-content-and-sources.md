# Doc 6 — Content Guide, Fact Ledger & Asset Acquisition

**Goal:** Equip writers and researchers to author kid-captivating, emotionally resonant, 100% citation-backed stories and gather properly licensed NASA media in parallel with engineering from Day 1.

**Schedule:** Starts immediately after Phase 0 and feeds Phases 2, 3, and 4 continuously.

---

## 6.1 Voice, Tone & Storytelling Rules

The official challenge targets **school-age space enthusiasts** (sweet spot: ages 10–15, accessible to younger kids via voiceover while staying genuinely moving for adults and judges).

### Two Distinct Voices
1. **Lo-Ro (Your Orbital Guide):**
   - **Persona:** Curious, warm, observant orbital photographer who has circled the Moon every two hours since June 2009. Speaks in the present tense (*"Right below my camera is Mare Tranquillitatis..."*).
   - **Length limit:** **≤ 35 words (~10–12 seconds spoken)** per beat. Punchy sentences beat textbook paragraphs every time.
2. **The Hardware (First-Person Memory Logs):**
   - **Persona:** Proud, observant, poetic, and quietly hopeful—**never gloomy or scary**. Being left behind isn't tragic; these machines finished their jobs, unlocked big mysteries, or stayed behind to save mass so their human crew could lift off safely!
   - **Length limit:** **≤ 55 words (~15–18 seconds spoken)** per `memoryLog`.
   - **Sensory details:** Mention real physical sensations on the Moon—14-day blazing sun followed by 14-day freezing night, crisp bootprints that never blow away because there's no wind, Earth hanging motionless in the black sky.

### Jargon & Acronym Rule
- Never drop raw NASA acronyms (*ALSEP, LRRR, EASEP, S-IVB*) without translating them naturally in the same breath:
  - *Bad:* `"Apollo 11 deployed the EASEP including the LRRR and PSEP."`
  - *Good:* `"Before climbing back inside, Neil and Buzz set up a suitcase-sized science station—including a special mirror panel that still catches laser beams from Earth today!"`

---

## 6.2 Worked Data & Script Template

Copy this structure directly when authoring entries in `src/data/heroSites.ts`:

```ts
{
  id: "apollo-17-lrv",
  tier: "hero",
  name: "Apollo 17 Lunar Rover (LRV-3)",
  subtitle: "The cameraman left behind in Taurus-Littrow Valley",
  mission: "Apollo 17",
  nssdcaId: "1972-096C",
  year: 1972,
  lat: 20.1911,
  lon: 30.7723,
  region: "Taurus-Littrow Valley",
  primaryCategory: "rover",
  categories: ["rover", "lander"],
  summary:
    "Driven 35.9 km across mountains and orange volcanic glass, this electric Moon buggy had one final job after its astronauts climbed aboard Challenger: filming humanity's last Apollo liftoff.",
  hardwareLeftBehind: [
    "Lunar Roving Vehicle #3 (LRV-3) with color TV camera",
    "Challenger Lunar Module Descent Stage",
    "Apollo 17 ALSEP deep-core & heat-flow instruments",
  ],
  stats: [
    { label: "Earth Weight / Moon Weight", value: "210 kg / 35 kg", sourceIds: ["S-NSSDCA-1972-096C"] },
    { label: "Distance Driven", value: "35.9 km (Apollo record)", sourceIds: ["S-NSSDCA-1972-096C"] },
    { label: "Parked Distance from LM", value: "~145 meters east", sourceIds: ["S-LROC-AP17"] },
    { label: "Biggest Discovery", value: "3.7-billion-year-old orange volcanic soil", sourceIds: ["S-NSSDCA-1972-096C"] },
  ],
  loroIntro: {
    id: "ap17-loro-intro",
    speaker: "loro",
    mood: "excited",
    text: "Down in steep Taurus-Littrow Valley sits my favorite parked car in the solar system! Even from 50 kilometers up, I can still spot its twin tire tracks curving through the dust.",
    sourceIds: ["S-LROC-AP17"],
  },
  memoryLog: {
    id: "ap17-memory-log",
    speaker: "equipment",
    speakerLabel: "LRV-3 // TAURUS-LITTROW (DEC 1972)",
    mood: "nostalgic",
    text: "Gene and Jack patched my broken fender with duct tape and lunar maps! Before leaving, they parked me facing Challenger. When Houston tilted my camera up, I watched my friends ride a pillar of sparks back toward that blue marble in the sky.",
    sourceIds: ["S-NSSDCA-1972-096C"],
  },
  scienceImpact:
    "LRV-3 carried astronauts farther from their lander than any crew in history, uncovering ancient volcanic glass beads that proved the Moon once had fiery lava fountains.",
  artemisLink:
    "Future Artemis Lunar Terrain Vehicles (LTVs) build directly on LRV lessons—adding autonomous driving so rovers can keep exploring even between astronaut crews!",
  thenNow: {
    thenImage: "/images/sites/apollo-17-lrv/then.webp",
    thenCaption: "Gene Cernan beside LRV-3 at its final VIP parking spot (AS17-143-21932).",
    thenYear: 1972,
    nowImage: "/images/sites/apollo-17-lrv/now.webp",
    nowCaption: "LROC orbital view showing Challenger's shadow, foot trails, and LRV-3 parked 145 m east.",
    lrocImageId: "M168000580LR",
    hotspots: [
      { xPct: 44, yPct: 52, label: "Challenger Descent Stage" },
      { xPct: 76, yPct: 49, label: "LRV-3 Final Parking Spot" },
    ],
  },
  model3d: {
    glbPath: "/models/apollo-lrv.glb",
    title: "Apollo Lunar Roving Vehicle",
    scale: 1,
    sourceId: "S-3D-LRV",
  },
  widget: "rover-liftoff-cam",
  thumbnailImage: "/images/sites/apollo-17-lrv/thumb.webp",
  sourceIds: ["S-WAGNER-2017", "S-NSSDCA-1972-096C", "S-LROC-AP17"],
}
```

---

## 6.3 Citation Registry & Fact Ledger: `src/data/sources.ts`

Every factual claim, coordinate, mass, distance, or discovery **must** map to a verified ID in `src/data/sources.ts`.

### Core Foundational Entries (`sources.ts` seed)

| `id` | Source Title | Dataset | Primary URL |
| :-- | :-- | :-- | :-- |
| `S-SVS-4720` | CGI Moon Kit (LRO WAC & LOLA) | `SVS` | `https://svs.gsfc.nasa.gov/4720/` |
| `S-SVS-4851` | Deep Star Maps 2020 | `SVS` | `https://svs.gsfc.nasa.gov/4851/` |
| `S-WAGNER-2017` | Coordinates of Anthropogenic Features on the Moon (Wagner et al., 2017) | `LROC` | `https://lroc.im-ldi.com/` |
| `S-LROC-FEATURED` | LROC Featured Sites — Apollo & Robotic Landing Sites | `LROC` | `https://www.lroc.asu.edu/featured_sites` |
| `S-NSSDCA-MOON` | NSSDCA Lunar Exploration Master Catalog | `NSSDCA` | `https://nssdc.gsfc.nasa.gov/planetary/lunar/lunartimeline.html` |
| `S-ALSEP-ARCHIVE` | Apollo Lunar Surface Experiments Package (ALSEP) Data Recovery | `ALSEP` | `https://nssdc.gsfc.nasa.gov/planetary/lunar/alsep.html` |
| `S-LLR-SCIENCE` | Lunar Laser Ranging Retroreflector Science Overview (3.8 cm/yr recession) | `NSSDCA` | `https://science.nasa.gov/moon/` |
| `S-3D-CATALOG` | NASA 3D Resources — Official Spacecraft & Rover Models | `NASA-3D` | `https://science.nasa.gov/3d-resources/` |
| `S-IVL-ARCHIVE` | NASA Image and Video Library | `NASA-IVL` | `https://images.nasa.gov/` |

Add per-mission entries (`S-NSSDCA-1969-059C`, `S-LROC-AP11`, etc.) as each hero site's numbers are verified.

---

## 6.4 Asset Acquisition Checklist

| Asset Group | Where to Fetch | Target Format & Spec | Destination |
| :-- | :-- | :-- | :-- |
| **Moon Color & DEM** | Automated via `npm run assets:fetch` (`svs.gsfc.nasa.gov/4720`) | WebP tile pyramid + `.u16` height grid | `public/textures/moon/` |
| **Hero "Then" Photos (×9)** | `images.nasa.gov` (search Apollo AS11–AS17, Surveyor, Ranger, LCROSS IDs) | `1200×900` (4:3) WebP, quality 82 (`≤ 160 KB`) | `public/images/sites/<id>/then.webp` |
| **Hero "Now" Orbital Crops (×9)** | LROC Featured Sites / QuickMap (`quickmap.lroc.asu.edu`) annotated or clean NAC crops | `1200×900` (4:3) WebP, north-up, quality 85 (`≤ 180 KB`) | `public/images/sites/<id>/now.webp` |
| **Secondary Thumbnails (×20)** | `images.nasa.gov` & NSSDCA spacecraft diagrams/photos | `640×480` WebP (`≤ 60 KB`) | `public/images/sites/<id>/thumb.webp` |
| **3D Hardware Models (×3–4)** | `science.nasa.gov/3d-resources` / `github.com/nasa/NASA-3D-Resources` (*Apollo Lunar Module*, *Apollo Lunar Rover*, *Surveyor*, *LRO*) | `.glb` optimized via `npm run assets:models` (`≤ 1.5 MB` each) | `public/models/` |
| **Starfield (P1)** | NASA SVS Deep Star Maps 2020 (`starmap_2020_4k.exr/jpg`) | `4096×2048` WebP (`≤ 400 KB`) | `public/textures/sky/stars_4k.webp` |

> [!TIP]
> For `artemis-south-pole` (`Then vs. Now`), pair the **2009 LCROSS impact plume / LOLA shadowed crater data** ("The Scout") with **LROC/LOLA illuminated South Pole candidate landing region imagery** ("Next Stop: Artemis III")—a powerful narrative bridge to close Chapter 5!

---

## 6.5 NASA Media Licensing & Space Apps Compliance

- [ ] **Public Domain Verification:** NASA-created imagery, 3D models, and LRO/SVS data products are generally public domain (`17 U.S.C. § 105`), **provided no third-party copyright notice is attached**. Check the `Rights / Credit` field on every `images.nasa.gov` download.
- [ ] **Required Credit Lines:** LROC NAC images must include `"NASA / GSFC / Arizona State University"`. SVS Moon Kit textures must include `"NASA's Scientific Visualization Studio"`. Store these verbatim in `sources.ts` so `SourcesDrawer` renders them automatically.
- [ ] **No NASA Insignia Endorsement:** Per NASA Media Usage Guidelines and Space Apps rules, **do not** place the official NASA "Meatball" or "Worm" logo on our app branding/header in a way that implies official NASA authorship (the historical insignia appearing naturally on a 3D Lunar Module texture or archival Apollo photo is fine).
- [ ] **Zero Copyrighted Audio/Fonts:** Use OFL web fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`), procedural Web Audio tones, and self-generated or public-domain audio only.
