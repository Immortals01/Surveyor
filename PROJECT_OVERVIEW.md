# Project Overview: Abandoned, Not Forgotten

> **2026 NASA Space Apps Challenge**
> **Challenge:** [Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/)
> **Target Audience:** School-age space enthusiasts, students, and curious explorers of all ages

---

## 1. Core Concept & Vision

Since the 1960s, NASA has sent landers, rovers, descent stages, seismometers, mirrors, and cameras to the Moon. When their missions ended, these machines remained behind on the lunar dust as silent monuments to human curiosity.

**Our project** is a story-driven, interactive 3D lunar web experience that combines a **photorealistic 3D Moon** built from real NASA laser-altimetry and orbital imagery with an **expressive animated character guide**. Rather than presenting a dry map of coordinates, the character takes visitors on a cinematic journey from lunar orbit down to the dusty resting places of NASA's forgotten hardware—sharing their stories, letting the machines "speak" through first-person memory logs, revealing how they look from space today, and connecting their discoveries to NASA's upcoming **Artemis** missions.

---

## 2. The Storyteller & Narrative Experience

### Meet "Lo-Ro" — Your Orbital Guide
* **Who Lo-Ro Is:** An expressive, friendly animated character inspired by NASA's real **Lunar Reconnaissance Orbiter (LRO)**, which has been circling the Moon since 2009 photographing all the historic hardware resting below.
* **Why It Works:** Because the real LRO actually photographed these discarded artifacts from lunar orbit, making Lo-Ro the narrator is both emotionally engaging for kids and 100% grounded in NASA science.
* **Visual Presentation:** An animated 2D/SVG companion docked in a sleek mission HUD (with expressive states: *waving intro, scanning surface, narrating, nostalgic, excited*) paired with a subtle orbital scan-ring on the 3D globe.

### Dual-Perspective Storytelling
Every featured site blends two narrative voices so young explorers connect emotionally with the science:
1. **Lo-Ro's Guide Narration:** Warm, accessible context setting the scene as the camera swoops down toward a crater or mare.
2. **Equipment "First-Person Memory Log":** A short radio-style diary entry from the left-behind hardware itself (*"I'm the Apollo 15 Lunar Rover. My crew drove me 27.9 km across Hadley Rille before parking me one last time..."*).

### Two Exploration Modes
1. **Guided Story Tour (Default Intro Flow — 5 Curated Chapters):**
   * **Intro Sequence:** Lo-Ro greets the user against a sunlit rotating Moon and invites them on a guided tour (with an option to jump straight to Free Explore).
   * **Chapter 1 — The Robot Scouts (*Surveyor & Ranger*):** How early robotic landers proved astronauts wouldn't sink into lunar dust.
   * **Chapter 2 — Eagle's Base (*Apollo 11 Descent Stage & EASEP*):** What stayed behind at Tranquility Base so Armstrong and Aldrin could make it home.
   * **Chapter 3 — Old Friends on the Moon (*Apollo 12 & Surveyor 3*):** The incredible story of astronauts landing next to a dormant robot parked 2.5 years earlier to see how space weather aged it.
   * **Chapter 4 — The Parked Moon Buggies (*Apollo 15–17 Lunar Roving Vehicles*):** How Apollo 17's rover camera stayed awake alone to film its astronauts blasting off back to Earth.
   * **Chapter 5 — Still Working After 55+ Years (*Laser Retroreflectors → Artemis*):** Unpowered mirrors left in the dust that still bounce Earth lasers back today—leading directly to the Lunar South Pole where **Artemis** astronauts go next.
2. **Free Explore Mode:**
   * Spin, zoom, and tilt the 3D Moon freely.
   * Filter beacons by hardware type: **Landers & Descent Stages**, **Lunar Rovers**, **Science Experiments (ALSEP)**, **Still Active Today**, and **Robotic Impacts/Probes**.
   * Toggle sunlight angle (day/night terminator) and nearside/farside markers.

---

## 3. Site View & Interactive Storytelling Features

When visiting a hero site (via Guided Tour or clicking a marker), the camera flies smoothly down to the coordinates and opens an interactive **Story & Science Panel** without cluttering the Moon view:

* **Then vs. Now Comparison Slider:** Drag between an archival 1960s/1970s surface photo taken by astronauts and a real **LROC Narrow Angle Camera (NAC)** overhead image showing the exact descent stage, science cables, and footpath tracks still sitting in the regolith today.
* **3D Hardware Spotlight:** Inspect NASA's official `.glb` 3D model of key equipment (Apollo Lunar Module Descent Stage, Lunar Roving Vehicle, Surveyor Lander) alongside quick kid-friendly specs (*Mass Left Behind*, *Year Landed*, *Mission Lifespan*, *Biggest Discovery*).
* **1-Click Science Micro-Interactions (Hero Sites):**
  * **Fire an Earth Laser (*Apollo 11/14/15 Retroreflector*):** Click to shoot a laser pulse at the passive mirror array, watch the ~2.5-second light round-trip, and see how scientists discovered the Moon is drifting away by **3.8 cm per year**.
  * **Trigger a Moonquake (*ALSEP Passive Seismic Experiment*):** Visualize how abandoned Apollo seismometers rang "like a bell" across 12,000+ recorded moonquakes and meteoroid impacts before being switched off in 1977.
  * **Replay the Final Liftoff Shot (*Apollo 17 Rover TV Camera*):** Experience how Mission Control timed a remote tilt command across a 1.3-second radio delay so the parked rover filmed its crew leaving the Moon.
* **Voice, Captions & Soundscape:**
  * Spoken narration support (pre-generated natural voice clips with Web Speech fallback) synced with animated subtitles.
  * Subtle ambient lunar soundscape and archival Apollo radio beeps ("Quindar tones"), with prominent **Mute / Captions** toggles.

---

## 4. Marker Scope (Depth + Breadth)

To keep storytelling rich while showing the true scale of lunar exploration:
* **8–10 Hero Sites:** Full character narration, first-person equipment monologue, 3D hardware model/spotlight, *Then vs. Now* LROC photo slider, and interactive micro-science widget.
* **20–25 Secondary Sites:** Verified markers across the Moon (Ranger probes, Surveyor 1–7, Lunar Orbiter impact sites, Apollo S-IVB/LM impact seismic calibration sites, LADEE/GRAIL) featuring concise story cards, archival imagery, and scientific impact summaries.

---

## 5. Official NASA Open-Source Datasets & Assets

Every coordinate, texture, model, and historical fact is sourced from open NASA archives and cited directly in an in-app **"NASA Data Sources"** drawer (key for Space Apps judging):

| Component | Official NASA Source | How We Use It |
| :--- | :--- | :--- |
| **3D Moon Color & Elevation** | **NASA SVS CGI Moon Kit** ([svs.gsfc.nasa.gov/4720](https://svs.gsfc.nasa.gov/4720/)) | LRO Wide Angle Camera (WAC) global color mosaic + LOLA (Lunar Orbiter Laser Altimeter) elevation/normal maps for realistic crater shadows. |
| **Hardware Coordinates & Overhead Proof** | **LROC Featured Sites & Lunar Anthropogenic Objects** | Exact selenographic latitude/longitude of left-behind equipment + Narrow Angle Camera (NAC) orbital images showing hardware shadows today. |
| **Mission Specs & Science Discoveries** | **NSSDCA Master Catalog & ALSEP Archives** | Verified launch/landing dates, instrument lists, operational end dates, and scientific breakthroughs. |
| **3D Spacecraft & Hardware Models** | **NASA 3D Resources Catalog** ([science.nasa.gov/3d-resources](https://science.nasa.gov/3d-resources/)) | Official web-ready `.glb` / `.gltf` models (Apollo Lunar Module, Lunar Rover, Surveyor, LRO). |
| **Historical Photos & Audio** | **NASA Image and Video Library** ([images.nasa.gov](https://images.nasa.gov/)) | Public-domain surface photography and archival mission audio snippets. |

---

## 6. Technical Architecture & "High-Res Without Lag" Strategy

### Tech Stack
* **Framework:** React + TypeScript + Vite
* **3D Engine:** Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
* **UI & Character Animation:** Tailwind CSS + Framer Motion (expressive SVG/rigged character states synced to story beats)
* **Audio:** Web Audio API / Howler.js for layered ambient audio, radio effects, and voice playback

### Progressive Resolution Pipeline
Raw NASA TIFF maps reach hundreds of megabytes and would freeze browser GPUs if loaded directly. Instead, we use a **multi-tier progressive pipeline**:
1. **Instant Boot (< 2s):** Load optimized 2K/4K WebP/KTX2 LRO WAC albedo + LOLA normal/displacement maps so the Moon renders immediately at 60 FPS on laptops and tablets.
2. **Background High-Res Upgrade:** Stream higher-resolution 8K surface textures seamlessly once interactive.
3. **Close-Up Detail Swap:** When zooming into a landing site, transition smoothly to high-resolution **LROC NAC** local imagery and 3D `.glb` equipment models—giving the impression of orbital-to-surface zoom without memory spikes.

---

## 7. Proposed Project Structure

```text
nasa-test/
├── public/
│   ├── textures/moon/        # Progressive NASA SVS LRO WAC color + LOLA normal/displacement maps
│   ├── models/               # Official NASA .glb models (LM descent stage, LRV, Surveyor, LRO)
│   ├── images/sites/         # Curated NASA archival ("Then") & LROC orbital ("Now") images
│   └── audio/                # Ambient space loop, Quindar radio tones, narration clips
├── src/
│   ├── components/
│   │   ├── canvas/           # MoonGlobe, AtmosphereGlow, SiteMarkers, CameraRig, HardwareModelViewer
│   │   ├── character/        # LoRoGuide (animated SVG character rig + dialogue bubble + voice controls)
│   │   ├── story/            # GuidedTourBar, SiteStoryDrawer, ThenNowSlider, FirstPersonLog
│   │   └── interactions/     # LaserRetroreflectorSim, MoonquakeWaveform, RoverLiftoffCam
│   ├── data/
│   │   ├── heroSites.ts      # Rich narrative scripts, coordinates, NSSDCA/LROC citations
│   │   ├── secondarySites.ts # Additional verified lunar hardware markers
│   │   └── tourChapters.ts   # Guided 5-chapter story sequence
│   ├── hooks/                # Camera flight controller, progressive texture loader, audio manager
│   └── App.tsx
└── PROJECT_OVERVIEW.md
```

---

## 8. Implementation Roadmap

1. **Phase 1 — Photorealistic 3D Moon & Camera Rig:** Set up Vite + React + Three.js, integrate NASA SVS CGI Moon Kit textures (progressive 4K/8K + LOLA normal maps), realistic directional sun shadows, starfield, and smooth spherical `lat/lon` camera flight transitions.
2. **Phase 2 — Verified NASA Lunar Equipment Dataset & Beacons:** Populate hero and secondary lunar hardware coordinates from LROC/NSSDCA data with categorized, pulsing 3D surface markers and hover labels.
3. **Phase 3 — "Lo-Ro" Animated Character & Guided Tour Engine:** Build the expressive Lo-Ro character component, intro welcome sequence, typewriter + voiceover dialogue system, and the 5-chapter Guided Tour / Free Explore switcher.
4. **Phase 4 — Story Cards, *Then vs. Now* & Micro-Science Widgets:** Build the site story drawer featuring first-person hardware monologues, LROC *Then vs. Now* image comparison sliders, 3D `.glb` equipment previews, and interactive science mini-simulations.
5. **Phase 5 — Audio Atmosphere, Polish & NASA Citations:** Layer in toggleable space ambience/Quindar radio tones, responsive layout polish, and the transparent **NASA Open Data Credits** modal ready for Space Apps judging.
