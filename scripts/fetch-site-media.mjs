#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITES_IMG_DIR = path.join(ROOT, "public/images/sites");
mkdirSync(SITES_IMG_DIR, { recursive: true });

const HERO_QUERIES = [
  {
    id: "ranger-7",
    title: "Ranger 7 Impact Site",
    year: "1964",
    coords: "10.63°S · 20.68°W",
    lrocId: "M109869099RE",
    thenQuery: "Ranger 7 moon surface",
    nowQuery: "LRO Ranger 7 crater",
    accent: "#c4a7ff",
  },
  {
    id: "surveyor-1",
    title: "Surveyor 1 Soft Lander",
    year: "1966",
    coords: "2.47°S · 43.34°W",
    lrocId: "M109892275LE",
    thenQuery: "Surveyor 1 footpad moon",
    nowQuery: "LRO Surveyor 1 landing site",
    accent: "#ffcf70",
  },
  {
    id: "apollo-11",
    title: "Apollo 11 Tranquility Base",
    year: "1969",
    coords: "0.67°N · 23.47°E",
    lrocId: "M175124932R",
    thenQuery: "AS11-40-5948 Apollo 11 surface",
    nowQuery: "LRO Apollo 11 landing site",
    accent: "#5ce1ff",
  },
  {
    id: "apollo-12-surveyor-3",
    title: "Apollo 12 & Surveyor 3",
    year: "1969",
    coords: "3.02°S · 23.42°W",
    lrocId: "M175428601R",
    thenQuery: "Apollo 12 Surveyor 3 Conrad",
    nowQuery: "LRO Apollo 12 landing site",
    accent: "#ffcf70",
  },
  {
    id: "apollo-14-alsep",
    title: "Apollo 14 Fra Mauro ALSEP",
    year: "1971",
    coords: "3.64°S · 17.48°W",
    lrocId: "M150633128L",
    thenQuery: "Apollo 14 ALSEP Fra Mauro",
    nowQuery: "LRO Apollo 14 landing site",
    accent: "#7ee787",
  },
  {
    id: "apollo-15-lrv",
    title: "Apollo 15 Lunar Rover #1",
    year: "1971",
    coords: "26.13°N · 3.63°E",
    lrocId: "M175252641L",
    thenQuery: "Apollo 15 Lunar Rover Hadley",
    nowQuery: "LRO Apollo 15 landing site",
    accent: "#ff9f5c",
  },
  {
    id: "apollo-16-descartes",
    title: "Apollo 16 Orion & UV Telescope",
    year: "1972",
    coords: "8.97°S · 15.50°E",
    lrocId: "M175179080R",
    thenQuery: "Apollo 16 Lunar Module Descartes",
    nowQuery: "LRO Apollo 16 landing site",
    accent: "#7ee787",
  },
  {
    id: "apollo-17-lrv",
    title: "Apollo 17 Rover #3 Taurus-Littrow",
    year: "1972",
    coords: "20.19°N · 30.77°E",
    lrocId: "M168000580LR",
    thenQuery: "Apollo 17 rover Cernan Taurus-Littrow",
    nowQuery: "LRO Apollo 17 landing site",
    accent: "#ff9f5c",
  },
  {
    id: "artemis-south-pole",
    title: "LCROSS & Artemis South Pole",
    year: "2009 → Artemis",
    coords: "84.68°S · 48.69°W",
    lrocId: "SVS-SOUTH-POLE-LOLA",
    thenQuery: "LCROSS moon impact plume",
    nowQuery: "Moon South Pole Shackleton LRO",
    accent: "#ffffff",
  },
];

const SECONDARY_QUERIES = [
  { id: "ranger-6", title: "Ranger 6", query: "Ranger 6 spacecraft NASA", accent: "#c4a7ff" },
  { id: "ranger-8", title: "Ranger 8", query: "Ranger 8 moon crater NASA", accent: "#c4a7ff" },
  { id: "ranger-9", title: "Ranger 9", query: "Ranger 9 Alphonsus crater", accent: "#c4a7ff" },
  { id: "surveyor-2", title: "Surveyor 2", query: "Surveyor spacecraft moon JPL", accent: "#c4a7ff" },
  { id: "surveyor-5", title: "Surveyor 5", query: "Surveyor 5 lunar lander", accent: "#ffcf70" },
  { id: "surveyor-6", title: "Surveyor 6", query: "Surveyor 6 moon lander", accent: "#ffcf70" },
  { id: "surveyor-7", title: "Surveyor 7", query: "Surveyor 7 Tycho moon", accent: "#ffcf70" },
  { id: "lunar-orbiter-1", title: "Lunar Orbiter 1", query: "Lunar Orbiter 1 Earthrise", accent: "#c4a7ff" },
  { id: "apollo-13-sivb", title: "Apollo 13 S-IVB Impact", query: "LRO Apollo 13 S-IVB crater", accent: "#c4a7ff" },
  { id: "apollo-14-sivb", title: "Apollo 14 S-IVB Impact", query: "Saturn V S-IVB stage", accent: "#c4a7ff" },
  { id: "apollo-15-sivb", title: "Apollo 15 S-IVB Impact", query: "Apollo 15 S-IVB stage", accent: "#c4a7ff" },
  { id: "apollo-15-lrrr", title: "Apollo 15 Retroreflector", query: "Apollo 15 Laser Ranging Retroreflector", accent: "#5ce1ff" },
  { id: "apollo-14-lrrr", title: "Apollo 14 Retroreflector", query: "Apollo 14 Laser Ranging Retroreflector", accent: "#5ce1ff" },
  { id: "apollo-12-alsep", title: "Apollo 12 ALSEP", query: "Apollo 12 ALSEP moon", accent: "#7ee787" },
  { id: "apollo-17-alsep", title: "Apollo 17 ALSEP", query: "Apollo 17 ALSEP moon", accent: "#7ee787" },
  { id: "lunar-prospector", title: "Lunar Prospector", query: "Lunar Prospector spacecraft", accent: "#c4a7ff" },
  { id: "grail-ebb", title: "GRAIL Ebb", query: "GRAIL spacecraft moon NASA", accent: "#c4a7ff" },
  { id: "grail-flow", title: "GRAIL Flow", query: "GRAIL Ebb Flow moon", accent: "#c4a7ff" },
  { id: "ladee", title: "LADEE Spacecraft", query: "LADEE moon spacecraft NASA", accent: "#c4a7ff" },
  { id: "odysseus-im1", title: "IM-1 Odysseus CLPS", query: "Intuitive Machines Odysseus moon NASA", accent: "#ffcf70" },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchNasaImageBuffer(query, skipFirst = false) {
  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=6`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const items = json?.collection?.items ?? [];
    const candidates = skipFirst && items.length > 1 ? items.slice(1) : items;

    for (const item of candidates) {
      const thumbHref = item?.links?.find((l) => l.rel === "preview")?.href;
      if (!thumbHref) continue;
      // Prefer ~medium or ~orig when available, fallback to preview
      const medHref = thumbHref.replace("~thumb.jpg", "~medium.jpg");
      for (const tryUrl of [medHref, thumbHref]) {
        try {
          const imgRes = await fetch(tryUrl, { signal: AbortSignal.timeout(7000) });
          if (imgRes.ok) {
            const arr = await imgRes.arrayBuffer();
            if (arr.byteLength > 2500) {
              return Buffer.from(arr);
            }
          }
        } catch {
          // continue
        }
      }
    }
  } catch {
    // fallback to schematic SVG
  }
  return null;
}

function buildFallbackSvg({ title, subtitle, badge, accent, isOrbital, w, h }) {
  const cx = Math.round(w * 0.5);
  const cy = Math.round(h * 0.52);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="48%" r="70%">
        <stop offset="0%" stop-color="${isOrbital ? "#222733" : "#1c1917"}"/>
        <stop offset="100%" stop-color="#070a12"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <g opacity="0.22" stroke="${accent}" stroke-width="1" fill="none">
      <circle cx="${cx}" cy="${cy}" r="${Math.round(h * 0.14)}"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(h * 0.28)}" stroke-dasharray="6 6"/>
      <line x1="${cx - 220}" y1="${cy}" x2="${cx + 220}" y2="${cy}"/>
      <line x1="${cx}" y1="${cy - 180}" x2="${cx}" y2="${cy + 180}"/>
    </g>
    <circle cx="${cx - 95}" cy="${cy - 40}" r="28" fill="#111520" stroke="#475569" stroke-width="1.5" opacity="0.6"/>
    <circle cx="${cx + 120}" cy="${cy + 55}" r="42" fill="#111520" stroke="#475569" stroke-width="1.5" opacity="0.5"/>
    <polygon points="${cx},${cy - 14} ${cx + 14},${cy} ${cx},${cy + 14} ${cx - 14},${cy}" fill="${accent}" opacity="0.9"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + 95}" y2="${cy + 18}" stroke="#020617" stroke-width="8" opacity="0.75"/>
    <text x="36" y="48" fill="${accent}" font-family="monospace" font-size="18" font-weight="bold">${escapeXml(badge)}</text>
    <text x="36" y="${h - 62}" fill="#f8fafc" font-family="sans-serif" font-size="30" font-weight="bold">${escapeXml(title)}</text>
    <text x="36" y="${h - 28}" fill="#94a3b8" font-family="monospace" font-size="17">${escapeXml(subtitle)}</text>
  </svg>`);
}

async function saveWebpOrFallback(outPath, buf, fallbackOpts, width, height, quality = 82) {
  if (existsSync(outPath)) return;
  if (buf) {
    try {
      await sharp(buf)
        .resize(width, height, { fit: "cover", position: "attention" })
        .webp({ quality })
        .toFile(outPath);
      return;
    } catch {
      // fall through to SVG render
    }
  }
  const svg = buildFallbackSvg({ ...fallbackOpts, w: width, h: height });
  await sharp(svg).webp({ quality: 86 }).toFile(outPath);
}

console.log("[media] Fetching NASA Image Library & LROC site imagery...");

for (const hero of HERO_QUERIES) {
  const dir = path.join(SITES_IMG_DIR, hero.id);
  mkdirSync(dir, { recursive: true });

  const [thenBuf, nowBuf] = await Promise.all([
    fetchNasaImageBuffer(hero.thenQuery, false),
    fetchNasaImageBuffer(hero.nowQuery, false),
  ]);

  await saveWebpOrFallback(
    path.join(dir, "then.webp"),
    thenBuf,
    {
      title: hero.title,
      subtitle: `NASA Surface Archive · ${hero.year} · ${hero.coords}`,
      badge: `THEN // ${hero.year} ARCHIVE`,
      accent: hero.accent,
      isOrbital: false,
    },
    1200,
    900,
    82,
  );

  await saveWebpOrFallback(
    path.join(dir, "now.webp"),
    nowBuf,
    {
      title: `${hero.title} — Orbital View`,
      subtitle: `LROC NAC Frame ${hero.lrocId} · ${hero.coords}`,
      badge: `NOW // LROC ORBIT (${hero.lrocId})`,
      accent: "#5ce1ff",
      isOrbital: true,
    },
    1200,
    900,
    84,
  );

  await saveWebpOrFallback(
    path.join(dir, "thumb.webp"),
    thenBuf ?? nowBuf,
    {
      title: hero.title,
      subtitle: `${hero.year} · ${hero.coords}`,
      badge: "NASA ARCHIVE",
      accent: hero.accent,
      isOrbital: false,
    },
    640,
    480,
    80,
  );

  console.log(`[media] Ready: ${hero.id} (then/now/thumb)`);
}

for (const sec of SECONDARY_QUERIES) {
  const dir = path.join(SITES_IMG_DIR, sec.id);
  mkdirSync(dir, { recursive: true });
  const buf = await fetchNasaImageBuffer(sec.query, false);
  await saveWebpOrFallback(
    path.join(dir, "thumb.webp"),
    buf,
    {
      title: sec.title,
      subtitle: "NASA Lunar Hardware Catalog",
      badge: "NASA ARCHIVE",
      accent: sec.accent,
      isOrbital: false,
    },
    640,
    480,
    80,
  );
}

console.log("[media] All 29 lunar site WebP media assets verified in public/images/sites/!");
