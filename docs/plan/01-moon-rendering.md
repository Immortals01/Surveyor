# Phase 1 — The Photorealistic Moon

**Goal:** A real NASA Moon that boots in under 2 s, then quietly sharpens to 16K (and optionally the native 27K) detail wherever the camera looks. It should have dramatic low-angle sunlight, a starfield, and a camera rig that can fly smoothly to any lat/lon.

**Estimated effort:** 1.5–2.5 days. The P0 subset takes about 6 hours.

**Depends on:** Phase 0.

---

## 1.1 Source Data: NASA SVS CGI Moon Kit

Base URL: `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/` (page: https://svs.gsfc.nasa.gov/4720/)

| File | Size | Use | Priority |
| :-- | :-- | :-- | :-- |
| `lroc_color_poles_1k.jpg` (1024×512) | 136 KB | L0 color tiles (instant boot) | P0 |
| `lroc_color_poles_4k.tif` (4096×2048) | 12.5 MB | L1 color tiles | P0 |
| `lroc_color_poles_8k.tif` (8192×4096) | 48 MB | L2 color tiles | P1 |
| `lroc_color_poles_16k.tif` (16384×8192) | 178 MB | L3 color tiles | P1 |
| `lroc_color_poles.tif` (27360×13680) | 494 MB | L4 color tiles: full native resolution | P2 |
| `ldem_4_uint.tif` (1440×720, 4 px/deg) | 2 MB | Height samples for geometry displacement | P0 |
| `ldem_16_uint.tif` (5760×2880, 16 px/deg) | 32 MB | Normal maps L0–L2 | P0 |
| `ldem_64_uint.tif` (23040×11520, 64 px/deg) | 506 MB | Normal maps L3–L4 | P2 |

**Height encoding (from the SVS page):** unsigned 16-bit, half-meters, offset +20,000, relative to the 1737.4 km reference sphere. So:

```ts
heightKm = value / 2000 - 10;
```

Credit line (required): **"NASA's Scientific Visualization Studio. LRO LROC WAC color mosaic and LOLA elevation data."**

---

## 1.2 Asset Pipeline Scripts

### `scripts/fetch-moon-kit.mjs` (P0)

- [ ] Download the files above into `raw/moon-kit/`, skipping any that already exist. Accept a `--level=p0|p1|p2` flag so teammates on slow connections only pull the 15 MB P0 set.
- [ ] Print the SHA-256 and size of each file for reproducibility.

### `scripts/build-textures.mjs` (P0 for L0/L1, P1 for L2/L3, P2 for L4)

**Tiling scheme:** a fixed **8 columns × 4 rows** grid. Each tile covers 45° × 45°. Row 0 is the northernmost band (lat 90…45). Column 0 starts at lon −180.

| Level | Tile size | Equivalent global map | Source |
| :-- | :-- | :-- | :-- |
| L0 | 128 px | 1K | `_1k.jpg` |
| L1 | 512 px | 4K | `_4k.tif` |
| L2 | 1024 px | 8K | `_8k.tif` |
| L3 | 2048 px | 16K | `_16k.tif` |
| L4 | 3420 px | 27K (native) | `lroc_color_poles.tif` |

Outputs:

```text
public/textures/moon/
├── color/L0..L4/{row}_{col}.webp      # quality ≈ 82
├── normal/L0..L3/{row}_{col}.webp     # lossless or quality 95 (normals hate artifacts)
├── height_1440x720.u16                # raw little-endian Uint16 (2 MB, gzips well)
└── manifest.json                      # { levels: [...], grid: {cols:8, rows:4}, normalLevels: [...] }
```

Implementation notes:

- [ ] Use `sharp` with `sharp.cache(false)` and `limitInputPixels: false` for the big TIFFs.
- [ ] **Decode each source once** to a raw buffer, then `extract()` tiles from that buffer. Re-decoding a 178 MB TIFF 32 times will take forever.
- [ ] Read 16-bit DEMs with `.raw({ depth: "ushort" })` to get a `Uint16Array`.
- [ ] **Normal map generation** (equirectangular-aware), per pixel `(x, y)` of a W×H height grid in km:

```js
const lat = (90 - ((y + 0.5) * 180) / H) * DEG;
const dxKm = (2 * Math.PI * R * Math.max(Math.cos(lat), 0.01)) / W; // east spacing
const dyKm = (Math.PI * R) / H;                                    // north spacing
const dhdx = (h(x + 1, y) - h(x - 1, y)) / (2 * dxKm);   // wrap x at the seam
const dhdn = (h(x, y - 1) - h(x, y + 1)) / (2 * dyKm);   // row-1 is north; clamp y
const n = normalize([-dhdx * STRENGTH, -dhdn * STRENGTH, 1]);
rgb = n.map((c) => Math.round((c * 0.5 + 0.5) * 255));
```

  The tangent frame is +u = east and +v = north, which matches three.js `SphereGeometry` UVs with the default `flipY`. Start with `STRENGTH ≈ 4`. If crater lighting looks inside-out, set `normalScale.y = -1` instead of regenerating.

- [ ] Write `height_1440x720.u16` straight from `ldem_4_uint.tif`, without resampling.
- [ ] Generate `manifest.json`, which the app reads at runtime, so missing levels simply aren't requested.
- [ ] **P2:** KTX2 / Basis Universal (`basisu` CLI) versions of L2+ tiles. They cut GPU memory by roughly 4–6× and allow more high-res tiles to stay resident.

---

## 1.3 Moon Geometry: `src/scene/moon/`

### `heightSampler.ts` (P0)

- [ ] Fetch `height_1440x720.u16` once and wrap it in a `Uint16Array`.
- [ ] Expose `sampleHeightKm(lat, lon)` (bilinear, wraps longitude) and `surfaceRadius(lat, lon) = 1 + (heightKm / 1737.4) * HEIGHT_EXAGGERATION`.
- [ ] Expose `surfaceNormal(lat, lon)` via finite differences on the sampler. It's used for seamless vertex normals and for orienting markers and the camera.

### `createTileGeometry(row, col, segments)` (P0)

```ts
const geo = new SphereGeometry(
  1, segments, segments,
  col * (Math.PI / 4),   // phiStart  (lon −180 + 45·col)
  Math.PI / 4,           // phiLength
  row * (Math.PI / 4),   // thetaStart (from north pole)
  Math.PI / 4,           // thetaLength
);
// UVs already span 0..1 inside each tile → tile images map directly.
```

- [ ] **CPU displacement:** for each vertex, compute `vector3ToLatLon` → `surfaceRadius` → scale the position. Shared edge vertices sample the same lat/lon, so tiles are **watertight with no seams**.
- [ ] Set vertex normals from `surfaceNormal()` (analytic), **not** `computeVertexNormals()`. The latter produces visible creases at tile borders.
- [ ] Segments per tile by quality tier: low 32, medium 64, high 96.
- [ ] Build all 32 geometries once, in a `requestIdleCallback` loop or a Web Worker (P1), so the first frame isn't blocked.

### `MoonTile.tsx` / `MoonGlobe.tsx` (P0)

- [ ] `MoonGlobe` renders 32 `<MoonTile row col />`.
- [ ] Each tile owns a `MeshStandardMaterial({ map, normalMap, roughness: 1, metalness: 0 })`.
- [ ] `map.colorSpace = SRGBColorSpace`, `normalMap.colorSpace = NoColorSpace`, and `anisotropy = gl.capabilities.getMaxAnisotropy()`.
- [ ] Boot: load all L0 tiles (32 × ~5 KB) before showing the Moon. Then L1 for all tiles in the background.
- [ ] **P2 realism:** swap Lambert-like shading for a Lommel-Seeliger term via `onBeforeCompile`. The real full Moon looks "flat" with no limb darkening.

---

## 1.4 Progressive Tile Manager: `src/scene/moon/tileManager.ts` (P1)

This is the "highest resolution possible without crashing the browser" engine.

**Every 250 ms** (not every frame):

1. For each tile, compute its **bounding sphere** and test it against the camera frustum. Also do a horizon test: skip tiles whose center normal faces away (`dot(tileCenterDir, camDir) < -0.2`).
2. For visible tiles, estimate the needed texel density:

```ts
const dist = camera.position.distanceTo(tileClosestPoint);
const pxPerUnit = viewportHeightPx / (2 * dist * Math.tan((fov * DEG) / 2));
const neededTilePx = TILE_ANGULAR_SIZE_UNITS * pxPerUnit; // ≈ 0.785 at the equator
const level = smallestLevelWith(tileSize >= neededTilePx), clamped to quality.maxLevel;
```

3. Queue loads by priority: on-screen center first, then by `level` gap. **Max 4 concurrent** fetches.
4. Load with `ImageBitmapLoader` (`imageOrientation: "flipY"`, `texture.flipY = false`). Decoding happens off the main thread.
5. Keep the current texture displayed until the higher level is ready, then swap. **P2:** 300 ms cross-fade shader.
6. **Memory budget:** an LRU per level. Defaults are high = 12 tiles at L3 and medium = 16 tiles at L2. On eviction, call `texture.dispose()` and fall back to the next lower resident level. L0 and L1 stay resident forever.
7. Hysteresis: only downgrade a tile after it has been "over-resolved" for more than 2 s, to avoid thrashing while zooming.

- [ ] Debug overlay (`?debug=tiles`): tint each tile by its current level and show a counter of resident textures and estimated GPU MB.

---

## 1.5 Lighting & Sky (P0 unless noted)

### `Sun.tsx`

- [ ] `DirectionalLight` at intensity ≈ 3, color `#fff6e8`.
- [ ] `ambientLight` ≈ 0.02. Space has no fill light, and the near-black shadows *are* the look.
- [ ] Faint "earthshine" `hemisphereLight` (≈ 0.04) from +X, so the night side isn't pure black. This also makes a nice story beat later.
- [ ] The sun direction comes from the store: `sunLongitude` (subsolar longitude, default about −50° for a dramatic terminator across the near side) and `sunLatitude` (default 1.5°).
- [ ] **P1** `SunControl` slider in Explore mode: "Move the Sun / lunar day."
- [ ] **P2** "Real sunlight right now": compute the subsolar point on the Moon with `astronomy-engine` (`RotationAxis(Body.Moon)` + geocentric Sun vector).
- [ ] Renderer: R3F defaults (ACES tone mapping, sRGB output). Tune `toneMappingExposure` for the regolith to read as warm grey, not white.

> [!NOTE]
> Crater **self-shadowing** (rims casting long shadows) needs shadow maps or horizon maps on displaced geometry. Normal map + 3× height exaggeration + a low sun gets about 80% of the look. Treat true crater shadows as P2.

### `Starfield.tsx`

- [ ] **P0** drei `<Stars radius={60} depth={20} count={6000} factor={3} saturation={0} fade />`.
- [ ] **P1** Replace or augment with a NASA SVS **Deep Star Maps** equirectangular image (search "Deep Star Maps 2020" on svs.gsfc.nasa.gov) as `scene.background`, dimmed to about 30%. That also counts as more NASA data.

### `EarthInSky.tsx` (P2)

- [ ] Earth textured with NASA Blue Marble at +X. Keep the true angular size (~1.9°) by placing it at 60 units with radius ≈ 1.0 instead of the real 221 units. Lo-Ro can say: *"From every near-side site, Earth hangs in the same spot in the sky."*

### `LroOrbit.tsx` (P1)

- [ ] A thin polar orbit ring (~50 km altitude → radius 1.03) with a small glowing dot moving along it. This is Lo-Ro's 3D presence.
- [ ] When Lo-Ro is in the "scanning" mood, emit a faint cone or scan line from the dot down to the surface.

---

## 1.6 Camera Rig: `src/scene/CameraRig.tsx` + `src/engine/camera.ts` (P0)

Use drei **`<CameraControls>`** (from the `camera-controls` lib). It has promise-based, smooth `setLookAt` / `rotateTo` / `dollyTo` transitions.

### Globe mode
- Target `(0,0,0)`, `minDistance = CAMERA.minDistance`, `maxDistance = CAMERA.maxDistance`.
- Scale rotate and dolly speed with altitude every frame, so it's precise when close and fast when far:
  `controls.azimuthRotateSpeed = controls.polarRotateSpeed = clamp(altitude * 0.8, 0.02, 1)`.
- **Intro / idle:** slow auto-rotation (`controls.azimuthAngle += 0.02 * delta`) while `mode === "intro"`.

### `flyToSite(site)`: a two-stage flight that never clips through the Moon

```ts
export async function flyToSite(c: CameraControls, lat: number, lon: number) {
  const P = latLonToVector3(lat, lon, surfaceRadius(lat, lon));
  const dir = P.clone().normalize();
  // Stage 1: orbit around the center along a sphere until the site faces the camera.
  const camHome = dir.clone().multiplyScalar(CAMERA.homeDistance * 0.7);
  await c.setLookAt(camHome.x, camHome.y, camHome.z, 0, 0, 0, true);
  // Stage 2: descend to an oblique view over the site (tilt ~30° toward local south).
  const south = new Vector3(0, -1, 0).projectOnPlane(dir).normalize();
  const camSite = P.clone()
    .addScaledVector(dir, CAMERA.siteAltitude)
    .addScaledVector(south, CAMERA.siteAltitude * 0.6);
  await c.setLookAt(camSite.x, camSite.y, camSite.z, P.x, P.y, P.z, true);
}
```

- [ ] Stage 1 uses a large `smoothTime`. If the angular distance is < 30°, skip stage 1.
- [ ] `goHome()`: return the target to the center at `homeDistance`, facing the last site.
- [ ] `cameraBus` (in `engine/camera.ts`) is a tiny module singleton that `CameraRig` registers its controls with. The HUD and tour engine call `cameraBus.flyToSite(id)` and `await` it.
- [ ] Lock user input during tour flights (`controls.enabled = false`). Re-enable after.
- [ ] `prefers-reduced-motion` or the in-app "Reduce motion" setting: use `enableTransition = false` (jump cuts with a 200 ms fade in the HUD).

---

## 1.7 Quality Tiers: `src/lib/quality.ts` (P0 basic, P1 adaptive)

| Tier | Max color level | Tile segments | DPR | Typical device |
| :-- | :-- | :-- | :-- | :-- |
| low | L1 | 32 | 1 | Phones, old iGPUs |
| medium | L2 | 64 | 1.5 | Most laptops (default) |
| high | L3 | 96 | 2 | Gaming / Apple Silicon |
| ultra (P2) | L4 | 96 | 2 | Demo machine for judging |

- [ ] Initial guess from `gl.capabilities.maxTextureSize`, `navigator.deviceMemory`, `hardwareConcurrency`, and `matchMedia("(pointer: coarse)")`.
- [ ] **P1** drei `<PerformanceMonitor onDecline={stepDown} onIncline={stepUp} />`.
- [ ] User override in Settings. Persist it in `localStorage`.

---

## 1.8 Close-up Site Patch (P2, used by Phase 4)

Even L4 is about 400 m/pixel, and hardware is invisible at that scale. For the "orbital-to-surface zoom" feel:

- [ ] For hero sites with an LROC NAC crop (`closeUpPatch` in the site data), place a tangent plane at the site. Size = `widthPx × metersPerPixel / 1737400` scene units. Rotate it north-up and lift it 0.0005 above the surface.
- [ ] Fade the plane in when the camera altitude is < 0.05 (≈ 90 km). Use a radial alpha mask so the edges blend into the globe.

---

## Acceptance Criteria

- [ ] **P0:** Moon visible < 2 s after page load, on a cold cache, over broadband.
- [ ] **P0:** Mare Tranquillitatis, Tycho's rays, and Mare Imbrium are recognizable. Craters read as 3D under the low sun.
- [ ] **P0:** `flyToSite(0.67, 23.47)` ends looking down at the SW edge of Mare Tranquillitatis and never passes through the Moon.
- [ ] **P1:** Zoomed close on Tycho, the debug overlay shows L3 tiles there and ≤ L1 on the far side.
- [ ] **P1:** No tile seams or cracks at any zoom. Resident texture memory stays under budget during a 2-minute free-fly.
- [ ] 60 FPS at the medium tier on a mid-range laptop.

## Risks & Mitigations

| Risk | Mitigation |
| :-- | :-- |
| 500 MB TIFFs exhaust laptop RAM in `sharp` | Process L4 per row band (`extract` a 3420-px-tall strip first); run on the strongest machine; commit outputs, not sources |
| Normal map sign wrong | Flip via `normalScale.y = -1`; verify against a known crater with the sun from the west |
| Texture pop-in looks cheap | Load L1 everywhere during the intro animation; P2 cross-fade |
| Deploy host per-file limits | All tiles are < 5 MB each; raw TIFFs never leave `raw/` |
