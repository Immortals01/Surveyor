#!/usr/bin/env bun
/**
 * Fetch official NASA Image Library photographs for every machine in the cast
 * and write optimized WebP files beside the site imagery.
 *
 * Source: https://images.nasa.gov (NASA Image and Video Library).
 * Run: bun scripts/fetch-machine-media.mjs
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "src/data/machines.json");

const data = JSON.parse(await readFile(DATA, "utf8"));
const targets = [];
for (const machine of data.cast) {
  for (const image of machine.gallery) {
    targets.push({ nasaId: image.nasaId, out: path.join(ROOT, "public", image.src) });
  }
}

async function fetchBytes(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function download(nasaId) {
  const candidates = [
    `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~medium.jpg`,
    `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~large.jpg`,
    `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~orig.jpg`,
  ];
  for (const url of candidates) {
    const bytes = await fetchBytes(url);
    if (bytes) return { bytes, url };
  }
  return null;
}

let ok = 0;
let skipped = 0;
let failed = 0;

for (const target of targets) {
  if (existsSync(target.out)) {
    skipped++;
    continue;
  }
  await mkdir(path.dirname(target.out), { recursive: true });
  const result = await download(target.nasaId);
  if (!result) {
    console.warn(`[machine-media] MISSING ${target.nasaId}`);
    failed++;
    continue;
  }
  await sharp(result.bytes)
    .rotate()
    .resize({ width: 1280, height: 900, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(target.out);
  console.log(`[machine-media] ${target.nasaId} -> ${path.relative(ROOT, target.out)}`);
  ok++;
}

// A small manifest so the panel can show a friendly credit line without a fetch.
const credits = {};
for (const machine of data.cast) {
  credits[machine.id] = machine.gallery.map((g) => ({
    nasaId: g.nasaId,
    credit: g.credit,
    caption: g.caption,
  }));
}
await writeFile(
  path.join(ROOT, "public/images/machines/credits.json"),
  JSON.stringify({ source: "NASA Image and Video Library (images.nasa.gov)", credits }, null, 2) + "\n",
);

console.log(`[machine-media] done: ${ok} new, ${skipped} existing, ${failed} missing.`);
if (failed > 0) process.exitCode = 1;
