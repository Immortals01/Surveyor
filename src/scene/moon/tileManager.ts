import {
  Camera,
  ClampToEdgeWrapping,
  Frustum,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  NoColorSpace,
  PerspectiveCamera,
  Sphere,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { DEG, latLonToVector3, normalizeLon } from "@/lib/geo";
import type { QualitySpec } from "@/lib/quality";
import { getTileCenterSphere, TILE_COLS, TILE_ROWS } from "./createTileGeometry";

export interface MoonManifest {
  grid: { cols: number; rows: number };
  colorLevels: Array<{ level: number; tileSize: number }>;
  normalLevels: Array<{ level: number; tileSize: number }>;
  hasStarMap?: boolean;
}

export interface TileTextureState {
  colorTex: Texture | null;
  normalTex: Texture | null;
  colorLevel: number;
  normalLevel: number;
}

type TileListener = (state: TileTextureState) => void;

interface TileRecord {
  row: number;
  col: number;
  key: string;
  sphere: Sphere;
  centerDir: Vector3;
  colorByLevel: Map<number, Texture>;
  normalByLevel: Map<number, Texture>;
  loadingColor: Set<number>;
  loadingNormal: Set<number>;
  desiredColorLevel: number;
  pinnedUntil: number;
  overResolvedSince: number | null;
  lastUsedAt: number;
  listeners: Set<TileListener>;
}

interface LoadJob {
  tile: TileRecord;
  kind: "color" | "normal";
  level: number;
  priority: number;
}

const DEFAULT_MANIFEST: MoonManifest = {
  grid: { cols: TILE_COLS, rows: TILE_ROWS },
  colorLevels: [
    { level: 0, tileSize: 128 },
    { level: 1, tileSize: 512 },
    { level: 2, tileSize: 1024 },
    { level: 3, tileSize: 2048 },
  ],
  normalLevels: [
    { level: 0, tileSize: 128 },
    { level: 1, tileSize: 360 },
    { level: 2, tileSize: 720 },
    { level: 3, tileSize: 1440 },
  ],
  hasStarMap: false,
};

const _projScreenMatrix = new Matrix4();
const _frustum = new Frustum();
const _camDir = new Vector3();
const _closest = new Vector3();
const _siteDir = new Vector3();

export class MoonTileManager {
  private tiles = new Map<string, TileRecord>();
  private manifest: MoonManifest = DEFAULT_MANIFEST;
  private manifestLoaded = false;
  private loader = new TextureLoader();
  private maxAnisotropy = 8;
  private activeLoads = 0;
  private readonly maxConcurrent = 8;
  private queue: LoadJob[] = [];

  constructor() {
    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const key = `${row}_${col}`;
        const sphere = getTileCenterSphere(row, col);
        this.tiles.set(key, {
          row,
          col,
          key,
          sphere,
          centerDir: sphere.center.clone().normalize(),
          colorByLevel: new Map(),
          normalByLevel: new Map(),
          loadingColor: new Set(),
          loadingNormal: new Set(),
          desiredColorLevel: 1,
          pinnedUntil: 0,
          overResolvedSince: null,
          lastUsedAt: performance.now(),
          listeners: new Set(),
        });
      }
    }
  }

  setMaxAnisotropy(aniso: number) {
    this.maxAnisotropy = Math.max(1, Math.min(16, aniso));
  }

  async init(): Promise<MoonManifest> {
    if (!this.manifestLoaded) {
      try {
        const res = await fetch("/textures/moon/manifest.json");
        if (res.ok) {
          this.manifest = (await res.json()) as MoonManifest;
        }
      } catch {
        // Use default manifest fallback
      }
      this.manifestLoaded = true;
    }

    // Immediately queue L0 everywhere for instant boot, followed by L1 baseline
    for (const tile of this.tiles.values()) {
      this.enqueue(tile, "color", 0, 1000);
      this.enqueue(tile, "normal", 0, 950);
      if (this.hasLevel("color", 1)) {
        this.enqueue(tile, "color", 1, 300);
      }
      if (this.hasLevel("normal", 1)) {
        this.enqueue(tile, "normal", 1, 250);
      }
    }
    this.pumpQueue();
    return this.manifest;
  }

  getManifest(): MoonManifest {
    return this.manifest;
  }

  /**
   * Pre-warm highest-resolution color and normal tiles for a target (lat, lon)
   * as soon as a camera flight begins so L3 textures are ready before arrival.
   */
  preloadSite(lat: number, lon: number): void {
    const now = performance.now();
    const clampedLat = Math.max(-89.999, Math.min(89.999, lat));
    const normLon = normalizeLon(lon);
    const primaryRow = Math.max(
      0,
      Math.min(TILE_ROWS - 1, Math.floor((90 - clampedLat) / 45)),
    );
    const primaryCol = Math.max(
      0,
      Math.min(TILE_COLS - 1, Math.floor((normLon + 180) / 45)),
    );

    latLonToVector3(clampedLat, normLon, 1, _siteDir).normalize();

    const maxColor = Math.max(
      ...this.manifest.colorLevels.map((l) => l.level),
      1,
    );
    const maxNormal = Math.max(
      ...this.manifest.normalLevels.map((l) => l.level),
      1,
    );

    for (const tile of this.tiles.values()) {
      const isPrimary = tile.row === primaryRow && tile.col === primaryCol;
      const dot = tile.centerDir.dot(_siteDir);
      // Include primary tile and any neighboring tile whose border is near the site
      if (!isPrimary && dot < 0.72) continue;

      const targetColor = isPrimary ? maxColor : Math.max(1, maxColor);
      const targetNormal = isPrimary ? maxNormal : Math.max(1, maxNormal);
      const prio = isPrimary ? 2200 : 1750 + dot * 100;

      tile.desiredColorLevel = Math.max(tile.desiredColorLevel, targetColor);
      tile.pinnedUntil = now + 5000;
      tile.overResolvedSince = null;
      tile.lastUsedAt = now + 5000;

      if (this.hasLevel("color", targetColor)) {
        this.enqueue(tile, "color", targetColor, prio);
      }
      if (this.hasLevel("normal", targetNormal)) {
        this.enqueue(tile, "normal", targetNormal, prio - 15);
      }
      if (targetColor > 2 && !tile.colorByLevel.has(targetColor) && this.hasLevel("color", 2)) {
        this.enqueue(tile, "color", 2, prio - 40);
      }
      if (targetNormal > 2 && !tile.normalByLevel.has(targetNormal) && this.hasLevel("normal", 2)) {
        this.enqueue(tile, "normal", 2, prio - 50);
      }
      this.notify(tile);
    }

    this.pumpQueue();
  }

  subscribe(row: number, col: number, listener: TileListener): () => void {
    const tile = this.tiles.get(`${row}_${col}`);
    if (!tile) return () => {};
    tile.listeners.add(listener);
    listener(this.getBestState(tile));
    return () => {
      tile.listeners.delete(listener);
    };
  }

  evaluateLod(
    camera: Camera,
    viewportHeightPx: number,
    quality: QualitySpec,
  ): void {
    if (!this.manifestLoaded) return;

    const now = performance.now();
    camera.updateMatrixWorld();
    _projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    _frustum.setFromProjectionMatrix(_projScreenMatrix);
    _camDir.copy(camera.position).normalize();

    const fovDeg =
      camera instanceof PerspectiveCamera ? camera.fov : 40;
    const tanHalfFov = Math.tan((fovDeg * DEG) / 2);

    const maxAvailableColor = Math.min(
      quality.maxColorLevel,
      Math.max(...this.manifest.colorLevels.map((l) => l.level), 0),
    );
    const maxAvailableNormal = Math.max(
      ...this.manifest.normalLevels.map((l) => l.level),
      0,
    );

    for (const tile of this.tiles.values()) {
      const isPinned = now < tile.pinnedUntil;
      const horizonDot = tile.centerDir.dot(_camDir);
      const visible =
        isPinned ||
        (horizonDot > -0.28 && _frustum.intersectsSphere(tile.sphere));

      if (!visible) {
        tile.desiredColorLevel = 1;
        this.checkDowngrade(tile, now);
        continue;
      }

      // Closest point on tile sphere to camera
      _closest
        .copy(camera.position)
        .sub(tile.sphere.center)
        .normalize()
        .multiplyScalar(tile.sphere.radius * 0.65)
        .add(tile.sphere.center);

      const dist = Math.max(0.04, camera.position.distanceTo(_closest));
      const pxPerUnit = viewportHeightPx / (2 * dist * tanHalfFov);
      const neededTilePx = 1.15 * pxPerUnit;

      let chosenColor = 1;
      for (const spec of this.manifest.colorLevels) {
        if (spec.level > maxAvailableColor) break;
        chosenColor = spec.level;
        if (spec.tileSize >= neededTilePx) break;
      }

      if (isPinned) {
        chosenColor = Math.max(chosenColor, maxAvailableColor);
      }

      tile.desiredColorLevel = chosenColor;
      tile.lastUsedAt = Math.max(tile.lastUsedAt, now);

      // Prioritize visible high-res upgrades above background L1 loads
      const prioBase = 500 + horizonDot * 120 + chosenColor * 90;
      if (this.hasLevel("color", chosenColor)) {
        this.enqueue(tile, "color", chosenColor, prioBase);
      }
      for (let lvl = chosenColor - 1; lvl >= 1; lvl--) {
        if (!tile.colorByLevel.has(chosenColor) && this.hasLevel("color", lvl)) {
          this.enqueue(tile, "color", lvl, prioBase - (chosenColor - lvl) * 35);
        }
      }

      const desiredNormal = Math.min(chosenColor, maxAvailableNormal);
      if (this.hasLevel("normal", desiredNormal)) {
        this.enqueue(tile, "normal", desiredNormal, prioBase - 10);
      }
      for (let lvl = desiredNormal - 1; lvl >= 1; lvl--) {
        if (
          !tile.normalByLevel.has(desiredNormal) &&
          this.hasLevel("normal", lvl)
        ) {
          this.enqueue(
            tile,
            "normal",
            lvl,
            prioBase - 15 - (desiredNormal - lvl) * 35,
          );
        }
      }

      this.checkDowngrade(tile, now);
    }

    this.enforceBudget(2, quality.l2BudgetTiles);
    this.enforceBudget(3, quality.l3BudgetTiles);
    this.pumpQueue();
  }

  disposeAll(): void {
    this.queue = [];
    for (const tile of this.tiles.values()) {
      for (const tex of tile.colorByLevel.values()) tex.dispose();
      for (const tex of tile.normalByLevel.values()) tex.dispose();
      tile.colorByLevel.clear();
      tile.normalByLevel.clear();
    }
  }

  private hasLevel(kind: "color" | "normal", level: number): boolean {
    const list =
      kind === "color"
        ? this.manifest.colorLevels
        : this.manifest.normalLevels;
    return list.some((l) => l.level === level);
  }

  private getBestState(tile: TileRecord): TileTextureState {
    let colorLevel = -1;
    let colorTex: Texture | null = null;
    for (const [lvl, tex] of tile.colorByLevel.entries()) {
      if (lvl <= Math.max(1, tile.desiredColorLevel) && lvl > colorLevel) {
        colorLevel = lvl;
        colorTex = tex;
      }
    }
    if (!colorTex) {
      for (const [lvl, tex] of tile.colorByLevel.entries()) {
        if (lvl > colorLevel) {
          colorLevel = lvl;
          colorTex = tex;
        }
      }
    }

    let normalLevel = -1;
    let normalTex: Texture | null = null;
    for (const [lvl, tex] of tile.normalByLevel.entries()) {
      if (lvl <= Math.max(1, tile.desiredColorLevel) && lvl > normalLevel) {
        normalLevel = lvl;
        normalTex = tex;
      }
    }
    if (!normalTex) {
      for (const [lvl, tex] of tile.normalByLevel.entries()) {
        if (lvl > normalLevel) {
          normalLevel = lvl;
          normalTex = tex;
        }
      }
    }

    return { colorTex, normalTex, colorLevel, normalLevel };
  }

  private notify(tile: TileRecord): void {
    const state = this.getBestState(tile);
    for (const fn of tile.listeners) {
      fn(state);
    }
  }

  private checkDowngrade(tile: TileRecord, now: number): void {
    const highestLoaded = Math.max(...tile.colorByLevel.keys(), 0);
    if (highestLoaded > Math.max(1, tile.desiredColorLevel)) {
      if (tile.overResolvedSince === null) {
        tile.overResolvedSince = now;
      } else if (now - tile.overResolvedSince > 2200) {
        this.notify(tile);
      }
    } else {
      tile.overResolvedSince = null;
    }
  }

  private enforceBudget(level: number, maxTiles: number): void {
    if (level <= 1) return;
    const holders: TileRecord[] = [];
    for (const tile of this.tiles.values()) {
      if (tile.colorByLevel.has(level)) {
        holders.push(tile);
      }
    }
    if (holders.length <= maxTiles) return;

    holders.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
    const toEvict = holders.length - maxTiles;
    for (let i = 0; i < toEvict; i++) {
      const tile = holders[i]!;
      if (tile.desiredColorLevel >= level && maxTiles > 0) continue;
      const cTex = tile.colorByLevel.get(level);
      if (cTex) {
        cTex.dispose();
        tile.colorByLevel.delete(level);
      }
      const nTex = tile.normalByLevel.get(level);
      if (nTex) {
        nTex.dispose();
        tile.normalByLevel.delete(level);
      }
      this.notify(tile);
    }
  }

  private enqueue(
    tile: TileRecord,
    kind: "color" | "normal",
    level: number,
    priority: number,
  ): void {
    const map = kind === "color" ? tile.colorByLevel : tile.normalByLevel;
    const loading = kind === "color" ? tile.loadingColor : tile.loadingNormal;
    if (map.has(level) || loading.has(level)) return;

    const existing = this.queue.find(
      (j) => j.tile === tile && j.kind === kind && j.level === level,
    );
    if (existing) {
      existing.priority = Math.max(existing.priority, priority);
      return;
    }
    this.queue.push({ tile, kind, level, priority });
  }

  private pumpQueue(): void {
    if (this.activeLoads >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    this.queue.sort((a, b) => b.priority - a.priority);

    while (this.activeLoads < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift()!;
      const map =
        job.kind === "color" ? job.tile.colorByLevel : job.tile.normalByLevel;
      const loading =
        job.kind === "color" ? job.tile.loadingColor : job.tile.loadingNormal;

      if (map.has(job.level) || loading.has(job.level)) continue;

      loading.add(job.level);
      this.activeLoads++;

      const url = `/textures/moon/${job.kind}/L${job.level}/${job.tile.row}_${job.tile.col}.webp`;
      this.loader.load(
        url,
        (tex) => {
          tex.colorSpace =
            job.kind === "color" ? SRGBColorSpace : NoColorSpace;
          tex.wrapS = ClampToEdgeWrapping;
          tex.wrapT = ClampToEdgeWrapping;
          tex.minFilter = LinearMipmapLinearFilter;
          tex.magFilter = LinearFilter;
          tex.anisotropy = this.maxAnisotropy;
          tex.needsUpdate = true;

          loading.delete(job.level);
          map.set(job.level, tex);
          this.activeLoads--;
          this.notify(job.tile);
          this.pumpQueue();
        },
        undefined,
        () => {
          loading.delete(job.level);
          this.activeLoads--;
          this.pumpQueue();
        },
      );
    }
  }
}

export const moonTileManager = new MoonTileManager();
