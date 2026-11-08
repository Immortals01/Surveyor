# Phase 4 — Story Drawer, 3D Spotlight & Science Micro-Widgets

**Goal:** Turn each landing site into an interactive museum exhibit—combining first-person hardware memory logs, a *Then vs. Now* LROC orbital comparison slider, an inspectable NASA `.glb` 3D equipment spotlight, and three hands-on science simulations.

**Estimated effort:** 1.5–2.5 days. The P0 subset (including `LaserRetroreflector`) takes about 6 hours.

**Depends on:** Phase 2 (`schema.ts`, `heroSites.ts`). Runs **in parallel** with Phase 3.

---

## 4.1 Site Story Drawer: `src/hud/story/SiteDrawer.tsx` (P0)

Opens whenever `selectedSiteId !== null`.

### Responsive Framing
- **Desktop (`≥ 1024px`):** Right-docked glassmorphic drawer (`w-[440px] max-h-[calc(100dvh-2rem)]`), leaving the left ~65% of the viewport open so the Moon, crater shadows, and Lo-Ro remain unobstructed.
  - **Camera screen-offset polish (P1):** When the right drawer is open on desktop, call `controls.setFocalOffset(offsetX, 0, 0, true)` so the selected marker centers in the *visible left two-thirds* of the canvas rather than sitting directly behind the drawer.
- **Mobile (`< 1024px`):** Draggable/scrollable bottom sheet (`max-h-[62dvh]`) with a grab handle and sticky header.

### Hero vs. Secondary Layout
- **Hero Site (`tier === "hero"`):**
  - Header: Category color pill, Mission + Year, Site Name, NSSDCA ID badge, Close (`✕`) button.
  - Tab bar synced to `useAppStore.activeStoryTab`:
    1. **Story** (`MemoryLog` + `StatsGrid` + Hardware Left Behind list + *Path to Artemis* callout) — **P0**
    2. **Then vs. Now** (`ThenNowSlider`) — **P0**
    3. **Try the Science** (renders when `site.widget` is defined; badged with a glowing cyan dot) — **P0** for Laser, **P1** for Moonquake & Liftoff Cam
    4. **3D Hardware** (`ModelSpotlight`, rendered when `site.model3d` is defined) — **P1**
- **Secondary Site (`tier === "secondary"`):**
  - Clean single-scroll card: archival thumbnail (`thumbnailImage`), concise narrative `summary`, `StatsGrid`, `hardwareLeftBehind` tags, and citation chips.

---

## 4.2 Memory Log & Verified Stats: `MemoryLog.tsx` & `StatsGrid.tsx` (P0)

### `MemoryLog.tsx`
- Styled like an intercepted lunar telemetry postcard:
  - Monospace header (`FIRST-PERSON MEMORY // ${site.memoryLog.speakerLabel}`).
  - Play/Replay button (`▶ Hear Memory`) that triggers `speech.speak(site.memoryLog)` through the vintage radio filter (Phase 5) even when the user is in Free Explore mode.
  - Blockquote text in warm regolith/amber palette (`--color-sunlit`).

### `StatsGrid.tsx`
- 2×2 bento grid displaying `site.stats` (e.g., *Landed*, *Mass Left Behind*, *Active Lifespan*, *Key Discovery*).
- Every stat card displays small clickable citation superscripts (`[1]`) mapped to `stat.sourceIds`, opening `SourcesDrawer` directly to that NASA archive entry.

---

## 4.3 Then vs. Now Comparison Slider: `src/hud/story/ThenNowSlider.tsx` (P0)

Pairs a 1960s/1970s surface astronaut photograph (**Then**) against a modern **LROC Narrow Angle Camera (NAC)** overhead orbital photo (**Now**) showing the exact hardware casting shadows in the dust today.

- [ ] **P0 Split-clip implementation:**
  - Stack `nowImage` (bottom layer, full width) and `thenImage` (top layer, clipped via `clipPath: \`inset(0 \${100 - pct}% 0 0)\``—GPU-composited, zero layout thrash).
  - Vertical divider handle with `onPointerDown` → `setPointerCapture` drag tracking across mouse and touch.
  - **Accessible `<input type="range" min={0} max={100}>`** overlaid/linked with `aria-label="Compare historical surface photo with modern LROC orbital photo"` so `ArrowLeft` / `ArrowRight` works out of the box.
- [ ] **P0 Corner badges & LROC credit:**
  - Top-left pill: `THEN · ${thenYear} (Surface)`
  - Top-right pill: `NOW · LROC Orbit (${lrocImageId})`
- [ ] **P1 Hardware callout pins (`hotspots`):**
  - When slider is `< 35%` (revealing the overhead LROC image), fade in labeled leader rings pointing out tiny features kids might otherwise miss (e.g., *"Eagle Descent Stage"*, *"Dark astronaut bootprint trail"*, *"PSE Seismometer"*).

---

## 4.4 3D Hardware Spotlight: `ModelSpotlight.tsx` + `scripts/optimize-models.mjs` (P1)

### Model Optimization Pipeline (`scripts/optimize-models.mjs`)
Official `.glb` files from **NASA 3D Resources** often ship at 15–60 MB with uncompressed 4K PNGs. Normalize them into `public/models/` at **≤ 1.5 MB each**:

```bash
# Inside scripts/optimize-models.mjs (wrapping @gltf-transform/cli):
npx gltf-transform optimize raw/models/apollo-lm.glb public/models/apollo-lm.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
```

Target model roster (`public/models/`):
1. `apollo-lm.glb` — Apollo Lunar Module (or Descent Stage)
2. `apollo-lrv.glb` — Apollo Lunar Roving Vehicle
3. `surveyor.glb` — Surveyor Lander
4. `lro.glb` — Lunar Reconnaissance Orbiter (optional Easter egg "Meet Lo-Ro's real twin!")

### Shared-Context Rendering (`ModelSpotlight.tsx`)
> [!IMPORTANT]
> Browsers cap active WebGL contexts (~8–16) and mobile Safari aggressively evicts multiple `<Canvas>` elements. Render the 3D spotlight inside a **drei `<View>`** portaled into `<App />`'s single `<Canvas>`, rather than spinning up a second `<Canvas>`.

- [ ] **P1** Lazy-load `.glb` via `useGLTF(model3d.glbPath)` inside `<Suspense fallback={<ModelSkeleton />}>` only when the user opens the **3D Hardware** tab.
- [ ] **P1** Auto-center and normalize bounding box (`<Center>` / `<Bounds fit clip observe>`), place over a subtle circular lunar-dust pedestal, and allow 1-finger/mouse `<OrbitControls enablePan={false} />`.
- [ ] **P1** Fallback: if WebGL memory is constrained (`qualityTier === "low"`) or a `.glb` fails to load, gracefully render a high-res annotated NASA diagram card.

---

## 4.5 Interactive Science Micro-Widgets: `src/hud/interactions/`

Each widget teaches **one unforgettable scientific concept** in under 30 seconds of play, with zero dense equations.

### Widget 1: `LaserRetroreflector.tsx` — *Apollo 11 (`apollo-11`)* (**P0 — on the 48h cut line!**)
**The Story & Science:** Apollo 11, 14, and 15 left unpowered corner-cube mirror arrays in the dust. Observatories on Earth still shoot laser pulses at them today!
- **Interactive Loop:**
  1. User clicks **`⚡ Fire Earth Laser Pulse`** (from Apache Point Observatory).
  2. Animated SVG/Canvas diagram shows a green `532 nm` photon beam racing from Earth → Tranquility Base in **1.28 s** (real time!), hitting the corner-cube prism diagram, and bouncing back to Earth at **2.56 s** total round-trip.
  3. **Live Distance Readout:** Computes `distance = (c × roundTripSeconds) / 2` down to millimeter precision, plus a fun callout: *"Out of 100 quadrillion photons fired, Earth telescopes catch only **1 to 5 photons** coming back!"*
  4. **"Time-Travel Drift" Slider (`1969 → 2026 → 2050`):** Dragging the year slider shows the Moon creeping away at **3.8 cm/year**—revealing that since July 1969, the Moon has drifted **~2.17 meters (~7.1 feet)** farther from Earth!

### Widget 2: `Moonquake.tsx` — *Apollo 14 ALSEP (`apollo-14-alsep`)* (**P1**)
**The Story & Science:** Left-behind ALSEP seismometers recorded over 12,000 seismic events until 1977 and discovered that while Earth quakes stop in ~1 minute, the dry, fractured Moon **"rings like a bell"** for up to an hour.
- **Interactive Loop:**
  1. Three trigger buttons: **`☄️ Meteoroid Hit`**, **`🌅 Sunrise Thermal Quake`**, and **`🚀 Saturn V S-IVB Crash`**.
  2. Dual live `<canvas>` seismogram traces side-by-side:
     - **Earth Crust (wet, weathered):** Sharp spike that damps flat in seconds.
     - **Lunar Crust (bone-dry, fractured):** Long, echoing envelope that keeps ringing!
  3. Optional Web Audio "Speed-Up ×40" toggle letting kids *hear* the low resonant rumble of the quake.

### Widget 3: `RoverLiftoffCam.tsx` — *Apollo 17 LRV-3 (`apollo-17-lrv`)* (**P1**)
**The Story & Science:** On December 14, 1972, astronauts Cernan and Schmitt parked their rover 145 m east of *Challenger* so its TV camera could film humanity's final Apollo liftoff. Because radio signals take **1.3 seconds** to travel from Houston to the Moon, controller Ed Fendell had to press **TILT UP** *before* actual ignition!
- **Interactive Loop:**
  1. Vintage 4:3 CRT monitor frame showing *Challenger* on the surface with a countdown clock (`T - 5.0 s … 0.0 s`).
  2. Prompt challenges the user: *"Radio waves take **1.3 seconds** to reach the rover! Press **TILT CAMERA UP** at `T - 1.3 s` so you don't miss liftoff!"*
  3. At `T = 0.0 s`, gold Kapton foil confetti bursts outward and the Ascent Stage rockets upward; a score badge shows how well the user kept *Challenger* in frame (`🎯 Bullseye — Ed Fendell level!`), then pans down to the quiet Descent Stage left behind forever.

---

## Acceptance Criteria

- [ ] **P0:** Selecting any of the 9 hero sites opens `SiteDrawer` with working *Story* and *Then vs. Now* tabs; selecting any secondary site renders its compact card cleanly.
- [ ] **P0:** `ThenNowSlider` drags smoothly at 60 FPS with mouse, touch, and keyboard arrows.
- [ ] **P0:** `LaserRetroreflector` runs a realistic ~2.56 s round-trip animation, updates photon/distance counters, and exposes the 3.8 cm/yr drift slider.
- [ ] **P1:** Opening `ModelSpotlight` loads an optimized `< 1.5 MB` `.glb` inside a shared `<View>` without creating a second WebGL context or dropping globe FPS.
- [ ] **P1:** `Moonquake` and `RoverLiftoffCam` play cleanly and work with or without sound.

## Risks & Mitigations

| Risk | Mitigation |
| :-- | :-- |
| "Then" surface photo and "Now" LROC overhead photo have completely different perspectives | Frame `ThenNowSlider` explicitly as **"Astronaut Eye-Level (Then) ↔ Lo-Ro Orbital View (Now)"** with corner badges so the perspective shift feels intentional and magical rather than misaligned |
| Large `.glb` stalls mobile network | Lazy-load only on *3D Hardware* tab click; enforce `≤ 1.5 MB` check in CI/asset script |
| Right drawer covers the selected Moon marker on 13" laptops | Apply `CameraControls.setFocalOffset` when `selectedSiteId` is open on desktop |
