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
  // Mars Hero Sites
  {
    id: "viking-1",
    title: "Viking 1 Lander (Chryse Planitia)",
    year: "1976",
    coords: "22.70°N · 48.22°W",
    lrocId: "PSP_001521_2025",
    thenQuery: "Viking 1 surface Mars Chryse",
    nowQuery: "HiRISE Viking 1 lander Mars",
    accent: "#ffcf70",
  },
  {
    id: "mars-pathfinder",
    title: "Pathfinder & Sojourner Rover",
    year: "1997",
    coords: "19.13°N · 33.22°W",
    lrocId: "PSP_001918_1995",
    thenQuery: "Sojourner rover Yogi rock Mars Pathfinder",
    nowQuery: "HiRISE Mars Pathfinder landing site",
    accent: "#ff9f5c",
  },
  {
    id: "spirit-rover",
    title: "Spirit Rover (Home Plate)",
    year: "2004",
    coords: "14.57°S · 175.47°E",
    lrocId: "ESP_016455_1650",
    thenQuery: "Spirit rover Husband Hill Gusev Mars",
    nowQuery: "HiRISE Spirit rover Home Plate Mars",
    accent: "#ff9f5c",
  },
  {
    id: "opportunity-rover",
    title: "Opportunity Rover (Perseverance Valley)",
    year: "2004",
    coords: "2.28°S · 5.42°W",
    lrocId: "ESP_056873_1775",
    thenQuery: "Opportunity rover tracks Meridiani Mars",
    nowQuery: "HiRISE Opportunity rover Perseverance Valley",
    accent: "#ff9f5c",
  },
  {
    id: "phoenix-lander",
    title: "Phoenix Polar Lander",
    year: "2008",
    coords: "68.22°N · 125.75°W",
    lrocId: "ESP_017662_2485",
    thenQuery: "Phoenix Mars lander ice trench",
    nowQuery: "HiRISE Phoenix Mars lander",
    accent: "#ffcf70",
  },
  {
    id: "curiosity-rover",
    title: "Curiosity Rover (Gale Crater)",
    year: "2012",
    coords: "4.59°S · 137.44°E",
    lrocId: "ESP_028269_1755",
    thenQuery: "Curiosity rover selfie Mount Sharp Mars",
    nowQuery: "HiRISE Curiosity rover tracks Mars",
    accent: "#5ce1ff",
  },
  {
    id: "insight-lander",
    title: "InSight Seismic Station",
    year: "2018",
    coords: "4.50°N · 135.62°E",
    lrocId: "ESP_073556_1845",
    thenQuery: "InSight Mars seismometer dome SEIS",
    nowQuery: "HiRISE InSight lander Elysium Planitia",
    accent: "#7ee787",
  },
  {
    id: "perseverance-rover",
    title: "Perseverance & Sample Depot",
    year: "2021",
    coords: "18.44°N · 77.45°E",
    lrocId: "ESP_068294_1985",
    thenQuery: "Perseverance rover Three Forks sample depot Mars",
    nowQuery: "HiRISE Perseverance rover Jezero Crater",
    accent: "#5ce1ff",
  },
  {
    id: "ingenuity-helicopter",
    title: "Ingenuity Mars Helicopter",
    year: "2021",
    coords: "18.50°N · 77.31°E",
    lrocId: "ESP_073877_1985",
    thenQuery: "Ingenuity Mars helicopter rotor blade dune",
    nowQuery: "Ingenuity helicopter Jezero Mars NASA",
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
  // Mars Secondary Sites
  { id: "viking-2", title: "Viking 2 Lander", query: "Viking 2 frost Mars Utopia", accent: "#ffcf70" },
  { id: "viking-1-backshell", title: "Viking 1 Backshell", query: "Viking 1 aeroshell heat shield Mars", accent: "#c4a7ff" },
  { id: "mars-polar-lander", title: "Mars Polar Lander", query: "Mars Polar Lander spacecraft NASA", accent: "#c4a7ff" },
  { id: "spirit-lander", title: "Columbia Memorial Station", query: "Spirit rover Columbia Memorial Station lander", accent: "#ffcf70" },
  { id: "opportunity-eagle-lander", title: "Challenger Memorial Station", query: "Opportunity Eagle Crater lander Mars", accent: "#ffcf70" },
  { id: "opportunity-heat-shield", title: "Opportunity Heat Shield", query: "Opportunity heat shield rock Mars", accent: "#c4a7ff" },
  { id: "curiosity-bradbury-landing", title: "Bradbury Landing", query: "Curiosity Bradbury Landing Mars", accent: "#ffcf70" },
  { id: "curiosity-sky-crane", title: "MSL Sky Crane Impact", query: "Curiosity Sky Crane descent stage Mars", accent: "#c4a7ff" },
  { id: "perseverance-sky-crane", title: "Mars 2020 Sky Crane", query: "Perseverance Sky Crane descent stage Mars", accent: "#c4a7ff" },
  { id: "perseverance-parachute-backshell", title: "Perseverance Parachute", query: "Perseverance parachute backshell Ingenuity Mars", accent: "#c4a7ff" },
  { id: "wright-brothers-field", title: "Wright Brothers Field", query: "Ingenuity first flight Mars Wright Brothers Field", accent: "#7ee787" },
  { id: "three-forks-depot", title: "Three Forks Sample Depot", query: "Perseverance sample tube Mars depot", accent: "#ffffff" },
  { id: "beagle-2", title: "Beagle 2 Lander", query: "Beagle 2 Mars lander HiRISE", accent: "#ffcf70" },
  { id: "mars-3-lander", title: "Mars 3 Lander", query: "HiRISE Mars 3 lander parachute", accent: "#ffcf70" },
  { id: "schiaparelli-edm", title: "Schiaparelli EDM Crater", query: "HiRISE Schiaparelli impact Mars", accent: "#c4a7ff" },
  { id: "phoenix-heat-shield", title: "Phoenix Parachute & Shield", query: "HiRISE Phoenix parachute Mars descent", accent: "#c4a7ff" },
  { id: "insight-heat-shield", title: "InSight Heat Shield", query: "HiRISE InSight parachute heat shield Mars", accent: "#c4a7ff" },
  { id: "mars-2-impact", title: "Mars 2 Impact Site", query: "Hellas Planitia Mars NASA", accent: "#c4a7ff" },
  { id: "mars-6-lander", title: "Mars 6 Descent Module", query: "Margaritifer Terra Mars NASA", accent: "#c4a7ff" },
  { id: "zhurong-rover", title: "Zhurong Rover & Lander", query: "HiRISE Zhurong rover Tianwen-1 Mars", accent: "#ff9f5c" },
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

async function saveWebpOrFallback(outPath, buf, fallbackOpts, width, height, quality = 80) {
  if (existsSync(outPath)) return;
  if (buf) {
    try {
      await sharp(buf)
        .resize(width, height, { fit: "cover", position: "attention", kernel: "lanczos3" })
        .webp({ quality })
        .toFile(outPath);
      return;
    } catch {
      // fall through to SVG render
    }
  }
  const svg = buildFallbackSvg({ ...fallbackOpts, w: width, h: height });
  await sharp(svg).webp({ quality: 84 }).toFile(outPath);
}

console.log("[media] Fetching NASA Image Library & LROC site imagery...");

for (const hero of HERO_QUERIES) {
  const dir = path.join(SITES_IMG_DIR, hero.id);
  mkdirSync(dir, { recursive: true });

  const thenBuf = await fetchNasaImageBuffer(hero.thenQuery, false);

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
    640,
    400,
    80,
  );

  await saveWebpOrFallback(
    path.join(dir, "thumb.webp"),
    thenBuf,
    {
      title: hero.title,
      subtitle: `${hero.year} · ${hero.coords}`,
      badge: "NASA ARCHIVE",
      accent: hero.accent,
      isOrbital: false,
    },
    640,
    400,
    80,
  );

  console.log(`[media] Ready: ${hero.id} (then/thumb)`);
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
    400,
    80,
  );
}

console.log("[media] All site WebP media assets verified in public/images/sites/!");
