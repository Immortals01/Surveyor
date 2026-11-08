#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "raw/moon-kit");
const OUT_MOON = path.join(ROOT, "public/textures/moon");
const OUT_SKY = path.join(ROOT, "public/textures/sky");

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

  console.log(`[normal] Generating equirectangular normal map from ${W}x${H} LOLA DEM...`);
  const rgb = Buffer.allocUnsafe(W * H * 3);
  const DEG = Math.PI / 180;

  const hKm = (x, y) => {
    const wx = ((x % W) + W) % W;
    const cy = Math.max(0, Math.min(H - 1, y));
    return u16[cy * W + wx] / 2000 - 10;
  };

  const dyKm = (Math.PI * MOON_RADIUS_KM) / H;

  for (let y = 0; y < H; y++) {
    const latRad = (90 - ((y + 0.5) * 180) / H) * DEG;
    const dxKm =
      (2 * Math.PI * MOON_RADIUS_KM * Math.max(Math.cos(latRad), 0.015)) / W;

    for (let x = 0; x < W; x++) {
      const dhdx = (hKm(x + 1, y) - hKm(x - 1, y)) / (2 * dxKm);
      const dhdn = (hKm(x, y - 1) - hKm(x, y + 1)) / (2 * dyKm);

      const nx = -dhdx * NORMAL_STRENGTH;
      const ny = -dhdn * NORMAL_STRENGTH;
      const nz = 1.0;
      const invLen = 1.0 / Math.hypot(nx, ny, nz);

      const idx = (y * W + x) * 3;
      rgb[idx] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
      rgb[idx + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
      rgb[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
    }
  }

  const normalSpecs = [
    { level: 0, tileSize: 128 },
    { level: 1, tileSize: 360 },
    { level: 2, tileSize: 720 },
  ];

  const builtNormalLevels = [];
  const srcTileW = Math.floor(W / COLS);
  const srcTileH = Math.floor(H / ROWS);

  for (const spec of normalSpecs) {
    if (spec.tileSize > srcTileW) continue;
    const outDir = path.join(OUT_MOON, `normal/L${spec.level}`);
    mkdirSync(outDir, { recursive: true });

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const outPath = path.join(outDir, `${row}_${col}.webp`);
        await sharp(rgb, {
          raw: { width: W, height: H, channels: 3 },
          limitInputPixels: false,
        })
          .extract({
            left: col * srcTileW,
            top: row * srcTileH,
            width: srcTileW,
            height: srcTileH,
          })
          .resize(spec.tileSize, spec.tileSize, { kernel: "lanczos3" })
          .webp({ quality: 92 })
          .toFile(outPath);
      }
    }

    builtNormalLevels.push({ level: spec.level, tileSize: spec.tileSize });
    console.log(`[normal] Built L${spec.level} (${COLS * ROWS} tiles @ ${spec.tileSize}px)`);
  }

  return builtNormalLevels;
}

async function buildStarfield() {
  const starSrc = path.join(RAW_DIR, "starmap_2020_4k_gal.jpg");
  if (!existsSync(starSrc)) return false;
  const starOut = path.join(OUT_SKY, "stars_4k.webp");
  await sharp(starSrc, { limitInputPixels: false })
    .resize(4096, 2048, { fit: "fill" })
    .webp({ quality: 82 })
    .toFile(starOut);
  console.log("[sky] Built public/textures/sky/stars_4k.webp");
  return true;
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
