# Phase 5 — Audio Atmosphere, Accessibility, Credits & Deploy

**Goal:** Give the experience its emotional polish—authentic Apollo Quindar radio tones, natural voice narration with zero-setup fallbacks, full keyboard and screen-reader accessibility, a judge-ready **NASA Data Sources** bibliography drawer, and a fast public deployment.

**Estimated effort:** 1–1.5 days. The P0 subset takes about 4 hours.

**Depends on:** Phases 1–4.

---

## 5.1 Web Audio Engine: `src/audio/AudioEngine.ts` (P0 / P1)

Built directly on the native **Web Audio API** (zero audio library bloat; procedural tones cost 0 KB of network transfer).

### Bus Architecture
```text
[Ambient Space Pad] ──► [ambientGain (ducks -8 dB during speech)] ──┐
[UI / Quindar Synth] ─► [sfxGain] ──────────────────────────────────┼──► [masterGain] ──► destination
[Lo-Ro Voice] ────────► [voiceGain] ────────────────────────────────┤
[Equipment Memory] ───► [Bandpass 350–2800Hz + Soft Clip] ──────────┘
```

### Tasks
- [ ] **P0 Autoplay-safe unlock:** Instantiate/resume `AudioContext` inside the user click handler of `IntroScreen` (*Start Guided Tour* / *Free Explore*) or the HUD unmute button. Never throw console errors before unlock.
- [ ] **P0 Mute sync:** Bind `masterGain.gain` smoothly (`setTargetAtTime`, 40 ms ramp) to `useAppStore.settings.muted`.
- [ ] **P1 Procedural Apollo Quindar Tones:**
  - Real Mission Control transmissions began with a **250 ms `2525 Hz`** sine beep ("intro tone") and ended with a **250 ms `2475 Hz`** sine beep ("outro tone").
  - Synthesize both with `OscillatorNode` + `GainNode` envelope at low volume (`0.08`) whenever an **Equipment First-Person Memory Log** starts and ends—instant goosebumps, 0 KB download!
- [ ] **P1 Vintage Telemetry Radio Filter:**
  - Route pre-recorded equipment memory clips through a `BiquadFilterNode` (`highpass 320 Hz` → `lowpass 2900 Hz`) plus a faint pink-noise bed (`0.015` gain) so machines sound like real 1960s/70s S-band transmitters.
- [ ] **P1 Ambient Lunar Soundscape:**
  - Seamless 20–30 s low-bitrate `.mp3`/`.ogg` warm space drone (`< 250 KB`) or dual-detuned sine/filtered-noise pad with automatic ducking whenever narration plays.

---

## 5.2 Narration System: `src/audio/speech.ts` & `scripts/generate-narration.mjs` (P0 / P1)

Browsers vary wildly in TTS support (for example, Linux Chromium often has empty `speechSynthesis.getVoices()`). Design a **3-tier fallback chain** so the tour **never** hangs waiting for audio:

1. **Tier 1 — Pre-generated MP3 clip (P1, best quality):**
   - Check `/audio/narration/manifest.json` for `line.id`. If present, stream `/audio/narration/${line.id}.mp3` through `AudioEngine` (enabling the radio filter on `equipment` lines!).
2. **Tier 2 — Web Speech API (`window.speechSynthesis`, P0):**
   - Used when no MP3 exists and `voiceEnabled && !muted`.
   - Pick the highest-quality local/natural English voice; differentiate voices slightly (`Lo-Ro`: `rate = 1.02, pitch = 1.08`; `Equipment`: `rate = 0.94, pitch = 0.92`).
   - **Watchdog timer (`maxDurationMs`):** Chromium `SpeechSynthesisUtterance.onend` occasionally fails to fire on long strings or tab switches. Always arm a safety timeout (`wordCount * 450 + 2000 ms`) that resolves the promise if `onend` goes missing!
3. **Tier 3 — Silent Reading Pacer (P0 fallback when muted or no voices exist):**
   - Resolve `speak(line)` after `clamp(line.text.length * 55, 2600, 9000) ms` so Guided Tour chapters still pace comfortably with captions alone.

- [ ] **P1 `scripts/generate-narration.mjs`:** Reads all `DialogueLine` entries from `heroSites.ts` and `tourChapters.ts`, hashes `line.text` so unchanged lines aren't regenerated, outputs `public/audio/narration/<lineId>.mp3` (`64 kbps` mono MP3, ~40–80 KB per line), and writes `manifest.json`.

---

## 5.3 Accessibility & Inclusive UX (P0)

Space Apps judges evaluate usability for young learners and diverse classrooms:

- [ ] **P0 Keyboard-complete flow:**
  - `Tab` / `Shift+Tab` reaches every HUD button with high-visibility cyan focus rings (`focus-visible:ring-2 ring-loro`).
  - `SiteIndex` drawer allows selecting and flying to all 29+ sites without touching the mouse/canvas.
  - `Escape` closes `SourcesDrawer`, then `SiteDrawer`, or exits `tour` pause modals.
  - `Space` / `ArrowRight` / `ArrowLeft` drives Guided Tour beats when focus isn't inside an input/slider.
- [ ] **P0 Screen-reader announcements:**
  - `DialogueBox` exposes an `aria-live="polite"` region updating once per line (update the SR-only full string once per beat, *not* 42 times/sec per typewriter character!).
- [ ] **P0 Contrast & Typography:**
  - Minimum `4.5:1` contrast ratio on all HUD text (`backdrop-blur-md bg-space-950/85` behind text over bright sunlit craters).
  - Body text ≥ `15px` with comfortable line height (`1.55`) for school-age readers.
- [ ] **P0 Reduced Motion:**
  - Honors OS `prefers-reduced-motion` + manual toggle in HUD settings: disables camera swoops (instant cut + quick crossfade), stops marker pulsing, stops Lo-Ro bobbing, and shows dialogue lines immediately.

---

## 5.4 Performance, Resilience & Error Handling (P0 / P1)

- [ ] **P0 Code splitting:**
  - Lazy-import `ModelSpotlight`, `SourcesDrawer`, and individual science widgets (`React.lazy`) so the initial JS chunk stays lean and boots the Moon fast.
- [ ] **P0 WebGL Error / Context-Lost Boundary (`CanvasFallback.tsx`):**
  - Handle `webglcontextlost` on the `<Canvas>` element and wrap `<Scene />` in an `<ErrorBoundary>`. If a school Chromebook has WebGL disabled, render a friendly 2D Moon fallback map with clickable site cards so the stories still work!
- [ ] **P1 Asset pre-warming during Tour:**
  - While Chapter `N` plays, quietly `fetch()` / `<link rel="prefetch">` the `thenImage` and `nowImage` of Chapter `N + 1`'s hero sites so `ThenNowSlider` opens with zero image pop-in.

---

## 5.5 NASA Data Sources Drawer: `src/hud/credits/SourcesDrawer.tsx` (P0)

Accessible anytime from the persistent top-right **`NASA Data & Sources`** button and from inline `[Source]` chips on stats and dialogue lines:

- [ ] **P0 Grouped Citation Catalog:**
  - Renders `src/data/sources.ts` grouped by portal (**NASA SVS**, **LROC**, **NSSDCA**, **ALSEP Archives**, **NASA 3D Resources**, **NASA Image & Video Library**).
  - Each entry shows title, official credit line, external link (`target="_blank" rel="noopener noreferrer"`), and which lunar sites use it.
  - If opened via a specific `highlightedSourceId`, auto-scrolls and flashes a cyan highlight border on that card.
- [ ] **P0 Mandatory Credit Footer:**
  - Explicitly displays required attributions (e.g., *"Lunar globe color and elevation data courtesy of NASA's Scientific Visualization Studio — CGI Moon Kit (LRO WAC & LOLA)."*) and clarifies that the project is built for the **2026 NASA Space Apps Challenge** and is not an official NASA endorsement.

---

## 5.6 Deployment & Space Apps Submission Checklist (P0)

### Static Hosting (Vercel / Cloudflare Pages / Netlify)
- Build command: `npm run build` → `dist/`
- Set long-lived cache headers (`Cache-Control: public, max-age=31536000, immutable`) on `/textures/moon/*` and `/models/*` (`vercel.json` or `public/_headers`) so repeat loads and tile swaps are instantaneous.

### Final QA Matrix Before Submission
- [ ] Cold-cache Chrome Throttled ("Fast 4G" / cable): interactive Moon in `< 3 s`, zero layout shifts.
- [ ] Full 5-chapter Guided Tour walkthrough recorded at 1080p 60 FPS (serves directly as raw footage for the **Space Apps 30-second / 2-minute project showcase video**!).
- [ ] Mobile check (`390×844` iPhone / Android viewport): `IntroScreen`, `LoRo`, `DialogueBox`, and `SiteDrawer` bottom sheet never overlap or clip off-screen.
- [ ] Root `README.md` updated with live demo URL, screenshot, architecture summary, local setup commands, and complete table of NASA open datasets used.

## Risks & Mitigations

| Risk | Mitigation |
| :-- | :-- |
| `speechSynthesis.onend` hangs on certain browsers, freezing Guided Tour | Always race `utterance` against a word-count watchdog timeout (`speech.ts`) |
| Glassmorphic dark text becomes unreadable when rotated over bright white highland craters | Use high-opacity dark backing (`bg-space-950/85`) + crisp borders on all text containers |
| Large repo/bundle size breaks free static host limits | Keep `raw/` gitignored; total committed `public/` under P0/P1 stays `< 85 MB` with every individual file `< 5 MB` |
