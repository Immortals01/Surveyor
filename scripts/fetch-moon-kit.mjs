#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const BASE_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720";
const STAR_URL =
  "https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003895/starmap_8k.jpg";
const MILKYWAY_URL =
  "https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003895/starmap_g4k.jpg";
const EARTH_BASE =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets";

const RAW_DIR = path.resolve(import.meta.dirname, "../raw/moon-kit");

const FILES = [
  { name: "lroc_color_poles_1k.jpg", url: `${BASE_URL}/lroc_color_poles_1k.jpg`, tier: "p0" },
  { name: "lroc_color_poles_4k.tif", url: `${BASE_URL}/lroc_color_poles_4k.tif`, tier: "p0" },
  { name: "ldem_4_uint.tif", url: `${BASE_URL}/ldem_4_uint.tif`, tier: "p0" },
  { name: "ldem_16_uint.tif", url: `${BASE_URL}/ldem_16_uint.tif`, tier: "p0" },
  { name: "lroc_color_poles_8k.tif", url: `${BASE_URL}/lroc_color_poles_8k.tif`, tier: "p1" },
  { name: "lroc_color_poles_16k.tif", url: `${BASE_URL}/lroc_color_poles_16k.tif`, tier: "p1" },
  { name: "starmap_2020_4k_gal.jpg", url: STAR_URL, tier: "p0", optional: true },
  { name: "milkyway_4k_gal.jpg", url: MILKYWAY_URL, tier: "p0", optional: true },
  { name: "earth_atmos_2048.jpg", url: `${EARTH_BASE}/earth_atmos_2048.jpg`, tier: "p0", optional: true },
  { name: "earth_clouds_1024.png", url: `${EARTH_BASE}/earth_clouds_1024.png`, tier: "p0", optional: true },
  { name: "earth_normal_2048.jpg", url: `${EARTH_BASE}/earth_normal_2048.jpg`, tier: "p0", optional: true },
  { name: "earth_specular_2048.jpg", url: `${EARTH_BASE}/earth_specular_2048.jpg`, tier: "p0", optional: true },
  { name: "earth_lights_2048.png", url: `${EARTH_BASE}/earth_lights_2048.png`, tier: "p0", optional: true },
];

const argLevel =
  process.argv.find((a) => a.startsWith("--level="))?.split("=")[1] ?? "p1";

const allowedTiers = argLevel === "p0" ? new Set(["p0"]) : new Set(["p0", "p1"]);

mkdirSync(RAW_DIR, { recursive: true });

async function sha256File(filePath) {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

async function downloadFile(entry) {
  const dest = path.join(RAW_DIR, entry.name);
  if (existsSync(dest) && statSync(dest).size > 1024) {
    const mb = (statSync(dest).size / (1024 * 1024)).toFixed(2);
    console.log(`[skip] ${entry.name} already exists (${mb} MB)`);
    return;
  }

  const tmp = `${dest}.part`;
  console.log(`[fetch] Downloading ${entry.name} ...`);
  try {
    const res = await fetch(entry.url);
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status} for ${entry.url}`);
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    await rename(tmp, dest);
    const sizeMb = (statSync(dest).size / (1024 * 1024)).toFixed(2);
    const hash = await sha256File(dest);
    console.log(`[done] ${entry.name} (${sizeMb} MB, sha256:${hash}…)`);
  } catch (err) {
    if (existsSync(tmp)) await unlink(tmp).catch(() => {});
    if (entry.optional) {
      console.warn(`[warn] Optional file ${entry.name} skipped: ${err.message}`);
      return;
    }
    throw err;
  }
}

for (const entry of FILES) {
  if (!allowedTiers.has(entry.tier)) continue;
  await downloadFile(entry);
}

console.log("NASA SVS CGI Moon Kit fetch complete.");
