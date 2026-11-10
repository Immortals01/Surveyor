#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "raw/moon-kit");
const OUT_MOON = path.join(ROOT, "public/textures/moon");
const OUT_SKY = path.join(ROOT, "public/textures/sky");
const OUT_EARTH = path.join(ROOT, "public/textures/earth");

const COLS = 8;
const ROWS = 4;
const MOON_RADIUS_KM = 1737.4;
const NORMAL_STRENGTH = 4.2;

const COLOR_LEVELS = [
  { level: 0, file: "lroc_color_poles_1k.jpg", tileSize: 128, quality: 82 },
  { level: 1, file: "lroc_color_poles_4k.tif", tileSize: 512, quality: 82 },
  { level: 2, file: "lroc_color_poles_8k.tif", tileSize: 1024, quality: 82 },
  { level: 3, file: "lroc_color_poles_16k.tif", tileSize: 2048, quality: 80 },
];

mkdirSync(OUT_MOON, { recursive: true });
mkdirSync(OUT_SKY, { recursive: true });
mkdirSync(OUT_EARTH, { recursive: true });

const FORCE = process.argv.includes("--force");

async function buildColorPyramid() {
  const builtLevels = [];

  for (const spec of COLOR_LEVELS) {
    const srcPath = path.join(RAW_DIR, spec.file);
    if (!existsSync(srcPath)) {
      console.log(`[skip] Color L${spec.level} (${spec.file} not present)`);
      continue;
    }

    const outDir = path.join(OUT_MOON, `color/L${spec.level}`);
    mkdirSync(outDir, { recursive: true });

    const allExist =
      !FORCE &&
      Array.from({ length: ROWS * COLS }, (_, idx) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        return existsSync(path.join(outDir, `${r}_${c}.webp`));
      }).every(Boolean);

    if (allExist) {
      builtLevels.push({ level: spec.level, tileSize: spec.tileSize });
      console.log(`[color] Skip L${spec.level} (already built @ ${spec.tileSize}px)`);
      continue;
    }

    console.log(`[color] Decoding ${spec.file} once into memory...`);
    const img = sharp(srcPath, { limitInputPixels: false });
    const meta = await img.metadata();
    const W = meta.width;
    const H = meta.height;

    // Convert 16-bit TIFFs cleanly to 8-bit sRGB raw buffer once
    const { data, info } = await img
      .toColourspace("srgb")
      .removeAlpha()
      .raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });

    const tileW = Math.floor(W / COLS);
    const tileH = Math.floor(H / ROWS);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const outPath = path.join(outDir, `${row}_${col}.webp`);
        let pipeline = sharp(data, {
          raw: { width: info.width, height: info.height, channels: info.channels },
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
    console.log(`[color] Built L${spec.level} (${COLS * ROWS} tiles @ ${spec.tileSize}px)`);
  }

  return builtLevels;
}

async function readUint16Dem(filePath) {
  const img = sharp(filePath, { limitInputPixels: false });
  const { data, info } = await img
    .raw({ depth: "ushort" })
    .toBuffer({ resolveWithObject: true });

  const u16 = new Uint16Array(
    data.buffer,
    data.byteOffset,
    info.width * info.height * info.channels,
  );

  // Take first channel if multi-channel
  if (info.channels === 1) {
    return { u16, width: info.width, height: info.height };
  }
  const single = new Uint16Array(info.width * info.height);
  for (let i = 0; i < single.length; i++) {
    single[i] = u16[i * info.channels];
  }
  return { u16: single, width: info.width, height: info.height };
}

async function buildHeightAndNormals() {
  const dem4Path = path.join(RAW_DIR, "ldem_4_uint.tif");
  if (!existsSync(dem4Path)) {
    throw new Error("Missing raw/moon-kit/ldem_4_uint.tif");
  }

  console.log("[height] Extracting raw 16-bit LOLA grid (1440x720)...");
  const dem4 = await readUint16Dem(dem4Path);
  const heightOut = path.join(OUT_MOON, "height_1440x720.u16");
  await writeFile(
    heightOut,
    Buffer.from(dem4.u16.buffer, dem4.u16.byteOffset, dem4.u16.byteLength),
  );
  console.log(
    `[height] Wrote height_1440x720.u16 (${(dem4.u16.byteLength / (1024 * 1024)).toFixed(2)} MB)`,
  );

  const dem16Path = path.join(RAW_DIR, "ldem_16_uint.tif");
  const normDem = existsSync(dem16Path) ? await readUint16Dem(dem16Path) : dem4;
  const { u16, width: W, height: H } = normDem;

  const normalSpecs = [
    { level: 0, tileSize: 128, quality: 92 },
    { level: 1, tileSize: 360, quality: 92 },
    { level: 2, tileSize: 720, quality: 94 },
    { level: 3, tileSize: 1440, quality: 94 },
  ].filter((spec) => spec.tileSize <= Math.floor(W / COLS) * 2);

  for (const spec of normalSpecs) {
    mkdirSync(path.join(OUT_MOON, `normal/L${spec.level}`), { recursive: true });
  }

  const maxNormalSize = normalSpecs[normalSpecs.length - 1].tileSize;
  console.log(
    `[normal] Generating C1 cubic B-spline normal pyramid up to L${normalSpecs[normalSpecs.length - 1].level} (${maxNormalSize}px/tile) from ${W}x${H} LOLA DEM...`,
  );

  const DEG = Math.PI / 180;
  const srcTileW = W / COLS;
  const srcTileH = H / ROWS;
  const dyKm = (Math.PI * MOON_RADIUS_KM) / H;

  const hKm = (x, y) => {
    const wx = ((x % W) + W) % W;
    const cy = y < 0 ? 0 : y >= H ? H - 1 : y;
    return u16[cy * W + wx] / 2000 - 10;
  };

  const tileRgb = Buffer.allocUnsafe(maxNormalSize * maxNormalSize * 3);
  const bx = new Float64Array(4);
  const dbx = new Float64Array(4);
  const by = new Float64Array(4);
  const dby = new Float64Array(4);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
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
          (2 * Math.PI * MOON_RADIUS_KM * Math.max(Math.cos(latRad), 0.015)) /
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
          OUT_MOON,
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
    console.log(`[normal] Row ${row + 1}/${ROWS} complete`);
  }

  return normalSpecs.map(({ level, tileSize }) => ({ level, tileSize }));
}

async function buildStarfield() {
  const star8kOut = path.join(OUT_SKY, "stars_8k.webp");
  const star4kOut = path.join(OUT_SKY, "stars_4k.webp");
  const mwOut = path.join(OUT_SKY, "milkyway_4k.webp");

  const star16kSrc = path.join(RAW_DIR, "starmap_16k.jpg");
  const starFallbackSrc = path.join(RAW_DIR, "starmap_2020_4k_gal.jpg");
  const starSrc = existsSync(star16kSrc) ? star16kSrc : starFallbackSrc;

  if (existsSync(starSrc)) {
    await sharp(starSrc, { limitInputPixels: false })
      .resize(8192, 4096, { kernel: "lanczos3", fit: "fill" })
      .sharpen({ sigma: 0.65, m1: 0.5, m2: 1.8 })
      .webp({ quality: 92, smartSubsample: true, effort: 4 })
      .toFile(star8kOut);
    console.log("[sky] Built public/textures/sky/stars_8k.webp");

    await sharp(starSrc, { limitInputPixels: false })
      .resize(4096, 2048, { kernel: "lanczos3", fit: "fill" })
      .sharpen({ sigma: 0.6, m1: 0.5, m2: 1.6 })
      .webp({ quality: 90, smartSubsample: true, effort: 4 })
      .toFile(star4kOut);
    console.log("[sky] Built public/textures/sky/stars_4k.webp");

    // Extract star-free diffuse Milky Way continuum in matching equatorial coordinates
    const mid = await sharp(starSrc, { limitInputPixels: false })
      .resize(2048, 1024, { kernel: "lanczos3", fit: "fill" })
      .median(5)
      .blur(1.4)
      .linear([8.8, 8.4, 8.2], [-24, -23, -22])
      .toBuffer();

    await sharp(mid)
      .resize(4096, 2048, { kernel: "cubic", fit: "fill" })
      .webp({ quality: 88, smartSubsample: true, effort: 4 })
      .toFile(mwOut);
    console.log("[sky] Built public/textures/sky/milkyway_4k.webp");
  }
  const earthJobs = [
    ["earth_atmos_2048.jpg", "earth_day_2k.webp", 2048, 1024, 88],
    ["earth_clouds_1024.png", "earth_clouds_2k.webp", 1024, 512, 86],
    ["earth_normal_2048.jpg", "earth_normal_2k.webp", 2048, 1024, 86],
    ["earth_specular_2048.jpg", "earth_specular_2k.webp", 2048, 1024, 84],
    ["earth_lights_2048.png", "earth_lights_2k.webp", 2048, 1024, 84],
  ];
  for (const [srcFile, outFile, w, h, q] of earthJobs) {
    const src = path.join(RAW_DIR, srcFile);
    if (existsSync(src)) {
      await sharp(src, { limitInputPixels: false })
        .resize(w, h, { fit: "fill" })
        .webp({ quality: q })
        .toFile(path.join(OUT_EARTH, outFile));
    }
  }
  return existsSync(star4kOut);
}

const colorLevels = await buildColorPyramid();
const normalLevels = await buildHeightAndNormals();
const hasStarMap = await buildStarfield();

const manifest = {
  grid: { cols: COLS, rows: ROWS },
  heightGrid: { width: 1440, height: 720, path: "/textures/moon/height_1440x720.u16" },
  colorLevels,
  normalLevels,
  hasStarMap,
};

await writeFile(
  path.join(OUT_MOON, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("[manifest] Wrote public/textures/moon/manifest.json");
