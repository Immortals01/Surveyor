#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "raw/mars-kit");
const OUT_MARS = path.join(ROOT, "public/textures/mars");

const COLS = 8;
const ROWS = 4;
const MARS_RADIUS_KM = 3396.2;
const NORMAL_STRENGTH = 3.2;

const COLOR_LEVELS = [
  { level: 0, tileSize: 128, quality: 82 },
  { level: 1, tileSize: 512, quality: 82 },
  { level: 2, tileSize: 1024, quality: 82 },
  { level: 3, tileSize: 2048, quality: 80 },
];

mkdirSync(OUT_MARS, { recursive: true });

const FORCE = process.argv.includes("--force");

async function buildMarsColorPyramid() {
  const vikingPath = path.join(RAW_DIR, "mars_viking_1km.jpg");
  const sssPath = path.join(RAW_DIR, "mars_sss_8k.jpg");

  if (!existsSync(vikingPath) && !existsSync(sssPath)) {
    throw new Error("Missing raw/mars-kit/mars_viking_1km.jpg or mars_sss_8k.jpg");
  }

  const builtLevels = [];

  // Check if all levels already exist
  const allAlreadyExist =
    !FORCE &&
    COLOR_LEVELS.every((spec) => {
      const outDir = path.join(OUT_MARS, `color/L${spec.level}`);
      return Array.from({ length: ROWS * COLS }, (_, idx) => {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        return existsSync(path.join(outDir, `${r}_${c}.webp`));
      }).every(Boolean);
    });

  if (allAlreadyExist) {
    console.log("[mars-color] All L0-L3 tiles already built.");
    return COLOR_LEVELS.map(({ level, tileSize }) => ({ level, tileSize }));
  }

  console.log("[mars-color] Decoding 16K USGS Viking MDIM2.1 + 8K True-Color Mars chroma...");
  const TARGET_W = 16384;
  const TARGET_H = 8192;

  const { data: vikBuf } = await sharp(existsSync(vikingPath) ? vikingPath : sssPath, {
    limitInputPixels: false,
  })
    .resize(TARGET_W, TARGET_H, { kernel: "lanczos3", fit: "fill" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });

  if (existsSync(sssPath) && existsSync(vikingPath)) {
    const { data: sssBuf } = await sharp(sssPath, { limitInputPixels: false })
      .resize(TARGET_W, TARGET_H, { kernel: "cubic", fit: "fill" })
      .toColourspace("srgb")
      .removeAlpha()
      .raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });

    // Blend high-frequency Viking 232m/1km albedo detail with realistic Martian ferric-oxide color grading
    const totalPx = TARGET_W * TARGET_H;
    for (let i = 0; i < totalPx; i++) {
      const idx = i * 3;
      const vr = vikBuf[idx];
      const vg = vikBuf[idx + 1];
      const vb = vikBuf[idx + 2];

      const sr = sssBuf[idx];
      const sg = sssBuf[idx + 1];
      const sb = sssBuf[idx + 2];

      const vLuma = 0.299 * vr + 0.587 * vg + 0.114 * vb;
      const sLuma = Math.max(12, 0.299 * sr + 0.587 * sg + 0.114 * sb);

      // Modulate true-color RGB by Viking's crisp high-res local contrast, blended 65% color / 35% raw Viking
      const ratio = (vLuma / sLuma) * 0.65 + 0.35;
      const r = Math.min(255, Math.max(0, Math.round(sr * ratio * 0.72 + vr * 0.28 * 1.18)));
      const g = Math.min(255, Math.max(0, Math.round(sg * ratio * 0.72 + vg * 0.28 * 0.96)));
      const b = Math.min(255, Math.max(0, Math.round(sb * ratio * 0.72 + vb * 0.28 * 0.84)));

      vikBuf[idx] = r;
      vikBuf[idx + 1] = g;
      vikBuf[idx + 2] = b;
    }
  }

  const tileW = TARGET_W / COLS; // 2048
  const tileH = TARGET_H / ROWS; // 2048

  for (const spec of COLOR_LEVELS) {
    const outDir = path.join(OUT_MARS, `color/L${spec.level}`);
    mkdirSync(outDir, { recursive: true });

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const outPath = path.join(outDir, `${row}_${col}.webp`);
        if (!FORCE && existsSync(outPath)) continue;

        let pipeline = sharp(vikBuf, {
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
      `[mars-color] Built L${spec.level} (${COLS * ROWS} tiles @ ${spec.tileSize}px)`,
    );
  }

  return builtLevels;
}

/**
 * Convert NASA PDS MGS MOLA MEGDR (big-endian Int16 meters, 0..360 E longitude)
 * into our unified (-180..+180 E longitude) Uint16 height grid:
 *   raw = Math.round((heightMeters / 1000 + 10) * 1000) = heightMeters + 10000
 * where raw / 1000 - 10 = heightKm (range -8.068 km to +21.134 km -> raw 1932..31134).
 */
function readMolaMegdrImg(filePath, width, height) {
  const buf = readFileSync(filePath);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = new Uint16Array(width * height);
  const halfW = width / 2;

  for (let y = 0; y < height; y++) {
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      // MOLA MEGDR starts at 0E..360E; shift by halfW so col 0 is -180W and center is 0E
      const srcX = (x + halfW) % width;
      const meters = view.getInt16((rowOff + srcX) * 2, false);
      const encoded = Math.max(0, Math.min(65535, meters + 10000));
      u16[rowOff + x] = encoded;
    }
  }

  return { u16, width, height };
}

async function buildMarsHeightAndNormals() {
  const mola4Path = path.join(RAW_DIR, "megt90n000cb.img");
  if (!existsSync(mola4Path)) {
    throw new Error("Missing raw/mars-kit/megt90n000cb.img");
  }

  console.log("[mars-height] Converting 16-bit MGS MOLA 4ppd grid (1440x720) to -180..+180E...");
  const dem4 = readMolaMegdrImg(mola4Path, 1440, 720);
  const heightOut = path.join(OUT_MARS, "height_1440x720.u16");
  await writeFile(
    heightOut,
    Buffer.from(dem4.u16.buffer, dem4.u16.byteOffset, dem4.u16.byteLength),
  );
  console.log(
    `[mars-height] Wrote public/textures/mars/height_1440x720.u16 (${(dem4.u16.byteLength / (1024 * 1024)).toFixed(2)} MB)`,
  );

  const mola16Path = path.join(RAW_DIR, "megt90n000eb.img");
  const normDem = existsSync(mola16Path)
    ? readMolaMegdrImg(mola16Path, 5760, 2880)
    : dem4;
  const { u16, width: W, height: H } = normDem;

  const normalSpecs = [
    { level: 0, tileSize: 128, quality: 92 },
    { level: 1, tileSize: 360, quality: 92 },
    { level: 2, tileSize: 720, quality: 94 },
    { level: 3, tileSize: 1440, quality: 94 },
  ].filter((spec) => spec.tileSize <= Math.floor(W / COLS) * 2);

  for (const spec of normalSpecs) {
    mkdirSync(path.join(OUT_MARS, `normal/L${spec.level}`), { recursive: true });
  }

  const maxNormalSize = normalSpecs[normalSpecs.length - 1].tileSize;
  console.log(
    `[mars-normal] Generating C1 cubic B-spline normal pyramid up to L${normalSpecs[normalSpecs.length - 1].level} (${maxNormalSize}px/tile) from ${W}x${H} MOLA DEM...`,
  );

  const DEG = Math.PI / 180;
  const srcTileW = W / COLS;
  const srcTileH = H / ROWS;
  const dyKm = (Math.PI * MARS_RADIUS_KM) / H;

  const hKm = (x, y) => {
    const wx = ((x % W) + W) % W;
    const cy = y < 0 ? 0 : y >= H ? H - 1 : y;
    return u16[cy * W + wx] / 1000 - 10;
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
          existsSync(path.join(OUT_MARS, `normal/L${spec.level}/${row}_${col}.webp`)),
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
          (2 * Math.PI * MARS_RADIUS_KM * Math.max(Math.cos(latRad), 0.015)) /
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
          OUT_MARS,
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
    console.log(`[mars-normal] Row ${row + 1}/${ROWS} complete`);
  }

  return normalSpecs.map(({ level, tileSize }) => ({ level, tileSize }));
}

const colorLevels = await buildMarsColorPyramid();
const normalLevels = await buildMarsHeightAndNormals();

const manifest = {
  grid: { cols: COLS, rows: ROWS },
  heightGrid: {
    width: 1440,
    height: 720,
    path: "/textures/mars/height_1440x720.u16",
    scalePerKm: 1000,
    offsetKm: -10,
  },
  colorLevels,
  normalLevels,
};

await writeFile(
  path.join(OUT_MARS, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("[mars-manifest] Wrote public/textures/mars/manifest.json");
