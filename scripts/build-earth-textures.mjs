#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "raw/earth-kit");
const OUT_EARTH = path.join(ROOT, "public/textures/earth");

const COLS = 8;
const ROWS = 4;
const EARTH_RADIUS_KM = 6371.0;
const NORMAL_STRENGTH = 14.0;

const COLOR_LEVELS = [
  { level: 0, tileSize: 128, quality: 82 },
  { level: 1, tileSize: 512, quality: 82 },
  { level: 2, tileSize: 1024, quality: 82 },
  { level: 3, tileSize: 2048, quality: 80 },
];

mkdirSync(OUT_EARTH, { recursive: true });

const FORCE = process.argv.includes("--force");

async function buildEarthColorPyramid() {
  const bmngPath = path.join(
    RAW_DIR,
    "world.topo.bathy.200407.3x21600x10800.jpg",
  );
  if (!existsSync(bmngPath)) {
    throw new Error(
      "Missing raw/earth-kit/world.topo.bathy.200407.3x21600x10800.jpg",
    );
  }

  const allAlreadyExist =
    !FORCE &&
    COLOR_LEVELS.every((spec) => {
      const outDir = path.join(OUT_EARTH, `color/L${spec.level}`);
      return Array.from({ length: ROWS * COLS }, (_, idx) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        return existsSync(path.join(outDir, `${r}_${c}.webp`));
      }).every(Boolean);
    });

  if (allAlreadyExist) {
    console.log("[earth-color] All L0-L3 tiles already built.");
    return COLOR_LEVELS.map(({ level, tileSize }) => ({ level, tileSize }));
  }

  console.log(
    "[earth-color] Decoding 21,600 x 10,800 NASA Blue Marble Next Generation...",
  );
  const TARGET_W = 16384;
  const TARGET_H = 8192;

  const { data: dayBuf } = await sharp(bmngPath, {
    limitInputPixels: false,
  })
    .resize(TARGET_W, TARGET_H, { kernel: "lanczos3", fit: "fill" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });

  const tileW = TARGET_W / COLS; // 2048
  const tileH = TARGET_H / ROWS; // 2048
  const builtLevels = [];

  for (const spec of COLOR_LEVELS) {
    const outDir = path.join(OUT_EARTH, `color/L${spec.level}`);
    mkdirSync(outDir, { recursive: true });

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const outPath = path.join(outDir, `${row}_${col}.webp`);
        if (!FORCE && existsSync(outPath)) continue;

        let pipeline = sharp(dayBuf, {
          raw: { width: TARGET_W, height: TARGET_H, channels: 3 },
          limitInputPixels: false,
        }).extract({
          left: col * tileW,
          top: row * tileH,
          width: tileW,
          height: tileH,
        });

        if (tileW !== spec.tileSize || tileH !== spec.tileSize) {
          pipeline = pipeline.resize(spec.tileSize, spec.tileSize, {
            kernel: "lanczos3",
          });
        }

        await pipeline.webp({ quality: spec.quality }).toFile(outPath);
      }
    }

    builtLevels.push({ level: spec.level, tileSize: spec.tileSize });
    console.log(
      `[earth-color] Built L${spec.level} (${COLS * ROWS} tiles @ ${spec.tileSize}px)`,
    );
  }

  // Also upgrade earth_day_2k.webp (used by background Earth on Moon & 2D fallback) with crisp Lanczos3 downsampling from 21.6K
  await sharp(dayBuf, {
    raw: { width: TARGET_W, height: TARGET_H, channels: 3 },
    limitInputPixels: false,
  })
    .resize(4096, 2048, { kernel: "lanczos3", fit: "fill" })
    .webp({ quality: 86 })
    .toFile(path.join(OUT_EARTH, "earth_day_2k.webp"));
  console.log("[earth-color] Upgraded public/textures/earth/earth_day_2k.webp to 4096x2048");

  return builtLevels;
}

async function buildEarthHeightAndNormals() {
  const elevPath = path.join(RAW_DIR, "gebco_08_rev_elev_21600x10800.jpg");
  if (!existsSync(elevPath)) {
    throw new Error(
      "Missing raw/earth-kit/gebco_08_rev_elev_21600x10800.jpg",
    );
  }

  console.log(
    "[earth-normal] Decoding NASA GEBCO Topography (21,600 x 10,800 -> 5,760 x 2,880)...",
  );
  const W = 5760;
  const H = 2880;
  const { data: elev8 } = await sharp(elevPath, {
    limitInputPixels: false,
  })
    .resize(W, H, { kernel: "lanczos3", fit: "fill" })
    .extractChannel(0)
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });

  // Also write 1440x720 u16 height grid for Earth (scaled 0..6.4 km above sea level with +10,000 m offset)
  const { data: elev4 } = await sharp(elevPath, {
    limitInputPixels: false,
  })
    .resize(1440, 720, { kernel: "lanczos3", fit: "fill" })
    .extractChannel(0)
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });

  const u16Dem = new Uint16Array(1440 * 720);
  for (let i = 0; i < u16Dem.length; i++) {
    const meters = Math.round((elev4[i] / 255) * 6400);
    u16Dem[i] = 10000 + meters;
  }
  await writeFile(
    path.join(OUT_EARTH, "height_1440x720.u16"),
    Buffer.from(u16Dem.buffer, u16Dem.byteOffset, u16Dem.byteLength),
  );
  console.log("[earth-height] Wrote public/textures/earth/height_1440x720.u16");

  const normalSpecs = [
    { level: 0, tileSize: 128, quality: 92 },
    { level: 1, tileSize: 360, quality: 92 },
    { level: 2, tileSize: 720, quality: 94 },
    { level: 3, tileSize: 1440, quality: 94 },
  ];

  for (const spec of normalSpecs) {
    mkdirSync(path.join(OUT_EARTH, `normal/L${spec.level}`), {
      recursive: true,
    });
  }

  const maxNormalSize = normalSpecs[normalSpecs.length - 1].tileSize;
  console.log(
    `[earth-normal] Generating C1 cubic B-spline normal pyramid up to L3 (${maxNormalSize}px/tile) from ${W}x${H} GEBCO DEM...`,
  );

  const DEG = Math.PI / 180;
  const srcTileW = W / COLS;
  const srcTileH = H / ROWS;
  const dyKm = (Math.PI * EARTH_RADIUS_KM) / H;

  // GEBCO topography scaled 0..6.4 km across 0..255
  const hKm = (x, y) => {
    const wx = ((x % W) + W) % W;
    const cy = y < 0 ? 0 : y >= H ? H - 1 : y;
    return (elev8[cy * W + wx] / 255) * 6.4;
  };

  const tileRgb = Buffer.allocUnsafe(maxNormalSize * maxNormalSize * 3);
  const bx = new Float64Array(4);
  const dbx = new Float64Array(4);
  const by = new Float64Array(4);
  const dby = new Float64Array(4);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const allRowColExist =
        !FORCE &&
        normalSpecs.every((spec) =>
          existsSync(
            path.join(OUT_EARTH, `normal/L${spec.level}/${row}_${col}.webp`),
          ),
        );
      if (allRowColExist) continue;

      for (let py = 0; py < maxNormalSize; py++) {
        const vDem = (row + (py + 0.5) / maxNormalSize) * srcTileH - 0.5;
        const iy = Math.floor(vDem);
        const ty = vDem - iy;
        const ty2 = ty * ty;
        const ty3 = ty2 * ty;
        const omy = 1 - ty;

        by[0] = (omy * omy * omy) / 6;
        by[1] = (3 * ty3 - 6 * ty2 + 4) / 6;
        by[2] = (-3 * ty3 + 3 * ty2 + 3 * ty + 1) / 6;
        by[3] = ty3 / 6;

        dby[0] = -0.5 * omy * omy;
        dby[1] = 1.5 * ty2 - 2 * ty;
        dby[2] = -1.5 * ty2 + ty + 0.5;
        dby[3] = 0.5 * ty2;

        const latRad =
          (90 - ((row + (py + 0.5) / maxNormalSize) * 180) / ROWS) * DEG;
        const dxKm =
          (2 * Math.PI * EARTH_RADIUS_KM * Math.max(Math.cos(latRad), 0.015)) /
          W;

        for (let px = 0; px < maxNormalSize; px++) {
          const uDem = (col + (px + 0.5) / maxNormalSize) * srcTileW - 0.5;
          const ix = Math.floor(uDem);
          const tx = uDem - ix;
          const tx2 = tx * tx;
          const tx3 = tx2 * tx;
          const omx = 1 - tx;

          bx[0] = (omx * omx * omx) / 6;
          bx[1] = (3 * tx3 - 6 * tx2 + 4) / 6;
          bx[2] = (-3 * tx3 + 3 * tx2 + 3 * tx + 1) / 6;
          bx[3] = tx3 / 6;

          dbx[0] = -0.5 * omx * omx;
          dbx[1] = 1.5 * tx2 - 2 * tx;
          dbx[2] = -1.5 * tx2 + tx + 0.5;
          dbx[3] = 0.5 * tx2;

          let dhdu = 0;
          let dhdv = 0;
          for (let m = 0; m < 4; m++) {
            const wy = by[m];
            const dwy = dby[m];
            const sy = iy - 1 + m;
            let rowH = 0;
            let rowDhDx = 0;
            for (let k = 0; k < 4; k++) {
              const hVal = hKm(ix - 1 + k, sy);
              rowH += hVal * bx[k];
              rowDhDx += hVal * dbx[k];
            }
            dhdu += rowDhDx * wy;
            dhdv += rowH * dwy;
          }

          const dhdx = dhdu / dxKm;
          const dhdn = -dhdv / dyKm;

          const nx = -dhdx * NORMAL_STRENGTH;
          const ny = -dhdn * NORMAL_STRENGTH;
          const nz = 1.0;
          const invLen = 1.0 / Math.hypot(nx, ny, nz);

          const idx = (py * maxNormalSize + px) * 3;
          tileRgb[idx] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
          tileRgb[idx + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
          tileRgb[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
        }
      }

      for (const spec of normalSpecs) {
        const outPath = path.join(
          OUT_EARTH,
          `normal/L${spec.level}/${row}_${col}.webp`,
        );
        let pipeline = sharp(tileRgb, {
          raw: { width: maxNormalSize, height: maxNormalSize, channels: 3 },
          limitInputPixels: false,
        });
        if (spec.tileSize !== maxNormalSize) {
          pipeline = pipeline.resize(spec.tileSize, spec.tileSize, {
            kernel: "lanczos3",
          });
        }
        await pipeline.webp({ quality: spec.quality }).toFile(outPath);
      }
    }
    console.log(`[earth-normal] Row ${row + 1}/${ROWS} complete`);
  }

  return normalSpecs.map(({ level, tileSize }) => ({ level, tileSize }));
}

async function buildEarthAuxLayers() {
  const nightSrc = path.join(RAW_DIR, "8k_earth_nightmap.jpg");
  if (existsSync(nightSrc)) {
    await sharp(nightSrc, { limitInputPixels: false })
      .resize(8192, 4096, { kernel: "lanczos3", fit: "fill" })
      .webp({ quality: 84 })
      .toFile(path.join(OUT_EARTH, "earth_lights_8k.webp"));
    console.log("[earth-aux] Built public/textures/earth/earth_lights_8k.webp");
  }

  const cloudsSrc = path.join(RAW_DIR, "8k_earth_clouds.jpg");
  if (existsSync(cloudsSrc)) {
    await sharp(cloudsSrc, { limitInputPixels: false })
      .resize(4096, 2048, { kernel: "lanczos3", fit: "fill" })
      .webp({ quality: 84 })
      .toFile(path.join(OUT_EARTH, "earth_clouds_4k.webp"));
    console.log("[earth-aux] Built public/textures/earth/earth_clouds_4k.webp");
  }

  const specSrc = path.join(RAW_DIR, "8k_earth_specular_map.tif");
  if (existsSync(specSrc)) {
    await sharp(specSrc, { limitInputPixels: false })
      .resize(4096, 2048, { kernel: "lanczos3", fit: "fill" })
      .webp({ quality: 84 })
      .toFile(path.join(OUT_EARTH, "earth_specular_4k.webp"));
    console.log("[earth-aux] Built public/textures/earth/earth_specular_4k.webp");
  }
}

const colorLevels = await buildEarthColorPyramid();
const normalLevels = await buildEarthHeightAndNormals();
await buildEarthAuxLayers();

const manifest = {
  grid: { cols: COLS, rows: ROWS },
  heightGrid: {
    width: 1440,
    height: 720,
    path: "/textures/earth/height_1440x720.u16",
    scalePerKm: 1000,
    offsetKm: -10,
  },
  colorLevels,
  normalLevels,
};

await writeFile(
  path.join(OUT_EARTH, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("[earth-manifest] Wrote public/textures/earth/manifest.json");
