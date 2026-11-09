# Abandoned, Not Forgotten: Voices on the Moon

> **2026 NASA International Space Apps Challenge** — *NASA's Discarded Equipment Storytelling*

An interactive 3D lunar museum and guided story tour where **Lo-Ro** (an animated character inspired by NASA's **Lunar Reconnaissance Orbiter**) flies you across a high-resolution 3D Moon built from **NASA SVS CGI Moon Kit (LRO WAC + LOLA laser altimetry)** data to meet **29 verified human artifacts** resting in the lunar dust—and hear their first-person memories.

---

## ✨ Key Features

- **16K Quadtree-Tiled 3D Moon (`L0` → `L3`):** Built from NASA's Scientific Visualization Studio CGI Moon Kit (**SVS #4720**), combining LRO Wide Angle Camera (WAC) color mosaics with Lunar Orbiter Laser Altimeter (LOLA) elevation displacement and Lommel-Seeliger + Hapke lunar regolith reflectance shading.
- **Lo-Ro Orbital Storyteller & Dual-Voice Narration:**
  - **Lo-Ro** (your friendly gold-foiled orbiter guide) introduces each landing site from orbit.
  - **First-Person Equipment Memory Logs:** Hear the discarded machines speak in the first person through synthesized Apollo **Quindar tones** (`2525 Hz` / `2475 Hz`) and a vintage S-band radio telemetry filter.
- **5-Chapter Guided Story Tour + Free Explore Mode:**
  1. *Before Boots: The Robot Scouts (1964–1968)* — Ranger 7 & Surveyor 1
  2. *One Small Step, One Giant Museum (1969)* — Apollo 11 Tranquility Base & Apollo 12 / Surveyor 3
  3. *Rovers & Moonquakes (1971–1972)* — Apollo 14 ALSEP, Apollo 15 LRV-1, Apollo 16 & Apollo 17 LRV-3
  4. *Planned Impacts & Modern Pioneers (1999–2024)* — GRAIL Ebb & Flow, LADEE, Odysseus (IM-1)
  5. *Why the Past Powers Artemis (2026+)* — Shackleton / Artemis III South Pole Region
- **Then vs. Now LROC Comparison Slider:** Drag between 1960s/1970s surface astronaut photography (**Then**) and modern **LROC Narrow Angle Camera (NAC)** orbital imagery (**Now**) showing the exact hardware and footstep trails in the dust today.
- **3 Interactive Science Micro-Widgets:**
  - **⚡ Apollo 11 Laser Retroreflector:** Fire a `532 nm` laser pulse from Apache Point Observatory across the real **1.28 s** one-way light travel time (`2.56 s` round trip) and slide from `1969 → 2050` to watch the Moon drift away at **3.8 cm/year**.
  - **📈 Apollo 14 ALSEP Moonquake Seismometer:** Trigger a Meteoroid Hit, Sunrise Thermal Quake, or Saturn V S-IVB Booster Crash to compare wet Earth crust damping against dry fractured Lunar crust that *"rings like a bell"*.
  - **📺 Apollo 17 Rover Liftoff Camera:** Time your `TILT UP` command from Houston at **T − 1.3 s** to beat the speed-of-light radio delay and keep *Challenger*'s ascent stage inside the rover's TV frame!
- **3D Spacecraft Hardware Spotlight:** Inspect lightweight PBR `.glb` models of the **Apollo Lunar Module Descent Stage**, **Apollo Lunar Roving Vehicle (LRV)**, and **Surveyor Lander**.

---

## 🛰️ Verified NASA Open Datasets Used

| Portal | Dataset / Archive | Usage in Project |
| :--- | :--- | :--- |
| **NASA SVS** | [CGI Moon Kit (SVS #4720)](https://svs.gsfc.nasa.gov/4720/) — LRO WAC + LOLA DEM | 3D Moon color mosaic pyramid (`L0`–`L3`), tangent-space normal maps, and `height_1440x720.u16` elevation sampler |
| **NASA SVS** | [Deep Star Maps 2020 (SVS #4851)](https://svs.gsfc.nasa.gov/4851/) | Physically accurate surrounding starfield |
| **LROC / ASU** | [Wagner et al. (2017) *Icarus* 283](https://doi.org/10.1016/j.icarus.2016.05.011) & [LROC Featured Sites](https://www.lroc.asu.edu/featured_sites/) | Selenographic coordinates (`lat`, `lon`) and overhead NAC *Now* orbital imagery |
| **NASA NSSDCA** | [Lunar Exploration Timeline & Spacecraft Catalog](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunartimeline.html) | Mission IDs (`1969-059C`, `1971-063C`, etc.), landed masses, lifespans, and instrument telemetry |
| **NASA 3D** | [NASA 3D Resources](https://nasa3d.arc.nasa.gov/models) | Apollo Lunar Module, Apollo Lunar Rover, and Surveyor 3D models |
| **NASA IVL / ALSJ** | [NASA Image & Video Library](https://images.nasa.gov/) & [Apollo Lunar Surface Journal](https://www.hq.nasa.gov/alsj/) | Historical surface *Then* photographs and astronaut field transcripts |

---

## 🚀 Local Setup & Scripts

```bash
# Install dependencies
bun install

# Start local development server
bun run dev

# Run unit & dataset verification tests (Bun Test)
bun test

# Lint & typecheck (Bun Lint & Bun Check)
bun run lint
bun run check

# Typecheck & build production bundle
bun run build
```

### Asset Pipeline Scripts (Optional Re-generation)

All required optimized WebP textures, `.u16` heightmaps, archival site thumbnails, and `.glb` 3D models are already built in `public/`. To rebuild from raw sources:

```bash
bun run assets:fetch      # Download raw NASA SVS #4720 TIFFs into raw/
bun run assets:textures   # Slice L0-L3 WebP tiles, normals, and LOLA .u16 heightmap
bun run assets:site-media # Fetch & optimize NASA archival Then/Now site images
bun run assets:models     # Build/optimize spacecraft .glb models in public/models/
bun run assets:narration  # Synthesize & master dual-voice audio narration in public/audio/narration/
```
