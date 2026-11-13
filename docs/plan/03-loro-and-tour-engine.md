# Phase 3 — "Lo-Ro" Character, Store & Guided Tour Engine

**Goal:** Bring the storytelling heart of the project to life: a shared Zustand state store, the expressive animated **Lo-Ro** character rig, streaming captions + voice hooks, the cinematic intro screen, and a rock-solid 5-chapter Guided Story Tour engine that transitions seamlessly to and from Free Explore mode.

**Estimated effort:** 1.5–2 days. The P0 subset takes about 6 hours.

**Depends on:** Phase 0, Phase 2 (`schema.ts`, `heroSites.ts`). Can be built **in parallel** with Phase 4.

---

## 3.1 Global Store Contract: `src/store/useAppStore.ts` (P0)

Both `src/scene` and `src/hud` subscribe to slices of this single Zustand store (with `persist` middleware only on `settings`).

```ts
import type { Category, WidgetKind } from "@/data/schema";
import type { LoRoMood } from "@/hud/character/moods";
import type { QualityTier } from "@/lib/quality";

export type AppMode = "intro" | "tour" | "explore";

export interface ActiveDialogue {
  lineId: string;
  speaker: "loro" | "equipment";
  speakerLabel: string;
  text: string;
  isRevealing: boolean; // true while typewriter is still streaming
  isSpeaking: boolean;  // true while audio/TTS is playing
}

export interface AppState {
  // Mode & selection
  mode: AppMode;
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  activeStoryTab: "story" | "then-now" | "model" | "science";

  // Explore filters & environment
  categoryFilter: Category | "all";
  heroOnly: boolean;
  sunLongitude: number; // default -50 (dramatic morning terminator across Apollo belt)
  sunLatitude: number;  // default 1.5

  // Character & dialogue
  loroMood: LoRoMood;
  dialogue: ActiveDialogue | null;

  // Guided Tour cursor
  tourChapterIndex: number; // 0..4
  tourBeatIndex: number;
  tourPaused: boolean;
  isCameraFlying: boolean;

  // Overlays & user settings (persisted)
  sourcesDrawerOpen: boolean;
  highlightedSourceId: string | null;
  settings: {
    muted: boolean;
    voiceEnabled: boolean;
    captionsEnabled: boolean;
    reduceMotion: boolean;
    qualityTier: QualityTier | "auto";
  };

  // Actions
  startTour: (chapterIndex?: number) => void;
  enterExplore: (keepSelection?: boolean) => void;
  selectSite: (siteId: string | null, tab?: AppState["activeStoryTab"]) => void;
  setHoveredSite: (siteId: string | null) => void;
  setCategoryFilter: (cat: Category | "all") => void;
  setSunLongitude: (lon: number) => void;
  openSources: (sourceId?: string) => void;
  closeSources: () => void;
  updateSettings: (patch: Partial<AppState["settings"]>) => void;
}
```

- [ ] **P0** Initialize `settings.reduceMotion` from `window.matchMedia("(prefers-reduced-motion: reduce)").matches` on first visit.
- [ ] **P0** Use narrow selectors (`useAppStore((s) => s.hoveredSiteId)`) inside R3F components so dialogue updates never re-render `<MoonGlobe />`.

---

## 3.2 Lo-Ro Character Rig: `src/hud/character/` (P0 / P1)

### Visual Concept (`LoRo.tsx`)
Lo-Ro is a friendly, recognizable caricature of NASA's real **Lunar Reconnaissance Orbiter**:
- **Body:** Warm gold MLI (multi-layer insulation) foil octagon bus (`#ffcf70` / `#c9933b` gradients).
- **Asymmetric Wing:** LRO's signature single-sided blue/cyan solar panel array (`#1c4e80` / `#5ce1ff` grid) on one side.
- **Antenna:** Articulated high-gain dish on a top boom that tilts and pings concentric scan arcs.
- **Face / Camera Lens:** Oversized circular **LROC Narrow Angle Camera** barrel acting as a warm, expressive single eye/visor with a glowing cyan iris, shutter-lid blink, and floating LED expression brow.
- **Voice Ring:** Subtle equalizer ring around the lens pulsing while `dialogue.speaker === "loro" && dialogue.isSpeaking`.

### Mood States (`moods.ts`)

| Mood | Priority | Visual Pose & Motion (`motion/react` variants) | When Used |
| :-- | :-- | :-- | :-- |
| `waving` | **P0** | Gentle bob, solar wing waves ±12°, happy curved aperture eye | Intro screen & tour finale |
| `narrating` | **P0** | Steady hover, subtle tilt toward Moon, blinking every ~4 s, speaking pulse | Default tour & site explanations |
| `scanning` | **P0** | Tilts forward, dish rotates, cyan scan cone sweeps downward | During `flyToSite` camera flights |
| `nostalgic` | **P1** | Softened warm-amber iris tint, slower bob, slight head tilt | While equipment memory logs play |
| `excited` | **P1** | Quick upward bounce, wide bright iris, twin antenna ping rings | Science widget discoveries & Artemis finale |

- [ ] **P0** Dock Lo-Ro at bottom-left (`z-30`), sized `96×96 px` on mobile and `128×128 px` on desktop, never covering center-screen Moon craters.
- [ ] **P0** Respect `settings.reduceMotion`: disable continuous bobbing/spinning and swap instantly between crisp mood poses.

---

## 3.3 Dialogue & Caption System: `src/hud/character/DialogueBox.tsx` (P0)

Anchored directly beside Lo-Ro (bottom-left to bottom-center, `max-w-xl`):

- [ ] **P0 Dual-voice styling:**
  - **`speaker === "loro"`:** Clean dark-glass card with `--color-loro` (`#5ce1ff`) border accent and badge `LO-RO // ORBITAL GUIDE`.
  - **`speaker === "equipment"`:** Warm amber-tinted radio-transmission card (`--color-sunlit` `#ffcf70`), monospace header (`MEMORY LOG // EAGLE DESCENT STAGE · 1969`), subtle scanline texture, and an audio waveform indicator.
- [ ] **P0 Typewriter + instant reveal:**
  - Reveal text at ~42 chars/sec (or instant when `reduceMotion` is true).
  - **First click / `Space` while revealing:** completes the full text immediately without skipping audio.
  - **Click / `Space` once revealed:** advances to the next beat in `tour` mode, or dismisses in `explore` mode.
- [ ] **P0 Citation chips:** Any `sourceIds` on the active line render small clickable `[Source]` pills that open `SourcesDrawer` scrolled to that NASA reference.
- [ ] **P0 Mute & Captions quick buttons** right on the dialogue header (`🔊 / 🔇`, `CC`).

---

## 3.4 Intro Sequence: `src/hud/intro/IntroScreen.tsx` (P0)

When `mode === "intro"`:
1. The Moon is already visible in the background (`L0` → `L1` tiles loading while `CameraRig` slowly orbits the sunlit terminator).
2. Top-left/center displays the project title (**Abandoned, Not Forgotten**) and subtitle (*Stories from NASA's Silent Pioneers on the Moon*).
3. Lo-Ro glides in (`waving` mood) and delivers a short welcome card:
   > *"Hi! I'm Lo-Ro. Since 2009, I've been orbiting the Moon taking photos of the rovers, landers, and experiments humans left behind in the dust. Ready to fly down and hear their stories?"*
4. Two prominent actions:
   - **Primary CTA (`P0`):** `Start Guided Tour (5 Chapters · ~4 min)` → unlocks `AudioEngine.unlock()`, starts Chapter 1 (`mode = "tour"`).
   - **Secondary CTA (`P0`):** `Free Explore the Moon` → unlocks `AudioEngine.unlock()`, switches to `mode = "explore"`, zooms slightly closer to the Apollo belt.

---

## 3.5 Guided Tour Engine: `src/engine/tourEngine.ts` & `src/data/tourChapters.ts` (P0)

### Chapter & Beat Data Contract (`src/data/tourChapters.ts`)

```ts
export type TourBeat =
  | { kind: "flySite"; siteId: string; sunLon?: number; announce?: DialogueLine }
  | { kind: "flyOverview"; lat: number; lon: number; distance?: number; sunLon?: number }
  | { kind: "speak"; line: DialogueLine; siteId?: string; openTab?: "story" | "then-now" | "model" | "science" }
  | { kind: "spotlightWidget"; siteId: string; promptLine: DialogueLine }; // pauses auto-advance so user can click e.g. "Fire Earth Laser!"

export interface TourChapter {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  heroSiteIds: string[];
  beats: TourBeat[];
}
```

### The 5 Curated Chapters
1. **Chapter 1 — The Robot Scouts:** `ranger-7` → `surveyor-1` (proving the regolith could hold a lander's weight).
2. **Chapter 2 — Eagle's Base:** `apollo-11` (what stayed behind at Tranquility Base + *Then vs. Now* LROC reveal).
3. **Chapter 3 — Old Friends & Moonquakes:** `apollo-12-surveyor-3` (astronauts visiting a 2.5-year-old robot) → `apollo-14-alsep` (listening to moonquakes).
4. **Chapter 4 — Parked Moon Buggies & Highland Labs:** `apollo-15-lrv` → `apollo-16-descartes` → `apollo-17-lrv` (filming the final Apollo liftoff from the Moon).
5. **Chapter 5 — Still Answering Earth → Artemis:** Revisit `apollo-11` retroreflector (`spotlightWidget` to fire an Earth laser!) → dramatic polar flight down to `artemis-south-pole` (`sunLon` shifted to graze Shackleton's peaks of eternal light), ending with an invitation to Free Explore.

### Pure Reducer (`src/engine/tourEngine.ts` — Unit Tested!)
Keep progression logic 100% pure and synchronous so Vitest tests every edge case in milliseconds:
- Events: `START_CHAPTER(idx)`, `NEXT_BEAT`, `PREV_BEAT`, `BEAT_AUTO_COMPLETED`, `PAUSE`, `RESUME`, `EXIT_TO_EXPLORE`.
- `spotlightWidget` beats **never** auto-advance without user click (`Continue Tour →`), giving kids time to fire the laser or trigger a moonquake without the camera yanking them away!

### Side-Effect Runner (`src/engine/useTourRunner.ts`)
- Watches `(mode, tourChapterIndex, tourBeatIndex, tourPaused)`.
- Creates a fresh `AbortController` per beat:
  - Cancels any in-flight speech (`speech.cancel()`) and supersedes any in-flight camera promise when the user clicks **Next**, **Back**, **Jump Chapter**, or **Exit Tour**.
  - On `flySite`: sets `loroMood = "scanning"`, triggers `cameraBus.flyToSite(siteId)`, optionally plays `announce` line simultaneously so flights have zero dead air, then selects the site.
  - On `speak`: sets `loroMood = line.mood`, starts typewriter + `speech.speak(line)`, and after audio finishes (plus a comfortable `900 ms` beat breath if not paused) dispatches `BEAT_AUTO_COMPLETED`.

- [ ] **P0** `src/engine/tourEngine.test.ts`: test start, forward/back across chapter boundaries, `spotlightWidget` hold behavior, and exit-to-explore reset.

---

## 3.6 Tour Controls & Mode Transitions: `src/hud/tour/` (P0 / P1)

- [ ] **P0 `TourBar.tsx`:** Top-center sleek pill bar showing:
  - 5 clickable chapter segments (`1. Scouts` … `5. Artemis`) with active progress indicator.
  - `◀ Back`, `⏸ / ▶`, `Next ▶`, and `Switch to Free Explore ✕`.
- [ ] **P1 `ChapterCard.tsx`:** Brief 1.8 s cinematic chapter-title lower-third banner when entering a new chapter during a camera flight.
- [ ] **P0 Arbitrary Marker Click During Tour:** If a curious user clicks an unrelated marker on the globe during a tour pause, pause the tour cleanly and show a small banner *"Paused Chapter 3 · [Resume Tour]"* instead of fighting them or locking them out.
- [ ] **P1 Return-to-Tour button in Free Explore:** In Explore mode, keep a subtle `"▶ Guided Tour"` button in the top bar so users can start or resume the story anytime.

---

## Acceptance Criteria

- [ ] **P0:** Clicking *Start Guided Tour* smoothly flies through all 5 chapters start-to-finish without console errors, orphaned voice clips, or stuck camera locks.
- [ ] **P0:** Rapidly mashing `Next ▶` and `◀ Back` 10 times in a row cancels prior camera/audio effects cleanly and lands on the exact expected beat.
- [ ] **P0:** Both Lo-Ro narration and first-person equipment memory logs display distinct visual styling and captions, working identically with sound muted.
- [ ] **P0:** `tourEngine.test.ts` passes 100% in `npm test`.
- [ ] **P1:** All 5 Lo-Ro moods animate smoothly and degrade gracefully under `prefers-reduced-motion`.

## Risks & Mitigations

| Risk | Mitigation |
| :-- | :-- |
| Async race conditions when skipping beats mid-flight | Monotonic `beatToken` / `AbortController` in `useTourRunner.ts`; stale `.then()` callbacks check `signal.aborted` before touching store |
| Tour feels sluggish waiting for flight *then* speech | Allow `flySite.announce` to speak *during* the 2.8 s orbital descent |
| Browser blocks audio autoplay on page load | Keep `IntroScreen` silent until user clicks *Start Guided Tour* or *Free Explore*, unlocking `AudioContext` inside that click handler |
