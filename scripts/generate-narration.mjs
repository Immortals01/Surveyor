#!/usr/bin/env bun
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { homedir } from "node:os";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/audio/narration");
mkdirSync(OUT_DIR, { recursive: true });

const LOCAL_EDGE_TTS = path.join(homedir(), ".local/bin/edge-tts");
const EDGE_TTS_BIN = existsSync("/tmp/tts-venv/bin/edge-tts")
  ? "/tmp/tts-venv/bin/edge-tts"
  : existsSync(LOCAL_EDGE_TTS)
    ? LOCAL_EDGE_TTS
    : "edge-tts";

// Extract all DialogueLine objects from heroSites.ts, marsHeroSites.ts, tourChapters.ts, marsTourChapters.ts, and Hud.tsx
async function collectDialogueLines() {
  const files = [
    path.join(ROOT, "src/data/heroSites.ts"),
    path.join(ROOT, "src/data/marsHeroSites.ts"),
    path.join(ROOT, "src/data/host.ts"),
    path.join(ROOT, "src/data/hosts.ts"),
    path.join(ROOT, "src/hud/character/hostLine.ts"),
    path.join(ROOT, "src/data/tourChapters.ts"),
    path.join(ROOT, "src/data/marsTourChapters.ts"),
    path.join(ROOT, "src/hud/Hud.tsx"),
  ];

  const lines = new Map();
  const blockRegex =
    /\{\s*id:\s*"([^"]+)",\s*speaker:\s*"(loro|equipment)"(?:,\s*speakerLabel:\s*"[^"]*")?(?:,\s*mood:\s*"[^"]*")?,\s*text:\s*"((?:[^"\\]|\\.)*)"/g;

  for (const file of files) {
    const src = await readFile(file, "utf8");
    let match;
    while ((match = blockRegex.exec(src)) !== null) {
      const id = match[1];
      const speaker = match[2];
      const text = match[3]
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/—/g, ", ")
        .replace(/−/g, " minus ");
      lines.set(id, { id, speaker, text });
    }
  }

  return Array.from(lines.values());
}

// Assign a single consistent voice (Emma — Tranquility Base voice) across all lines
function pickVoice(_line) {
  return {
    voice: "en-US-EmmaMultilingualNeural",
    rate: "+2%",
    pitch: "+0Hz",
  };
}

async function synthesizeLine(line) {
  const outMp3 = path.join(OUT_DIR, `${line.id}.mp3`);
  if (existsSync(outMp3)) {
    console.log(`[narration] Exists: ${line.id}.mp3`);
    return;
  }

  const rawMp3 = path.join(OUT_DIR, `${line.id}.raw.mp3`);
  const { voice, rate, pitch } = pickVoice(line);

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await execFileAsync(EDGE_TTS_BIN, [
        "--voice",
        voice,
        `--rate=${rate}`,
        `--pitch=${pitch}`,
        "--text",
        line.text,
        "--write-media",
        rawMp3,
      ]);
      break;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  // Gentle broadcast mastering via ffmpeg (warm, crisp full-range voice with gentle loudness normalization)
  const afFilter =
    "highpass=f=90,acompressor=threshold=-18dB:ratio=2:attack=15:release=180,volume=0.95";

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    rawMp3,
    "-af",
    afFilter,
    "-ac",
    "1",
    "-ar",
    "24000",
    "-b:a",
    "48k",
    outMp3,
  ]);

  await unlink(rawMp3).catch(() => {});
  console.log(`[narration] Generated ${line.id}.mp3 (${line.speaker} · ${voice})`);
}

const allLines = await collectDialogueLines();
console.log(`[narration] Found ${allLines.length} dialogue lines to synthesize...`);

// Process 2 at a time with retry protection
for (let i = 0; i < allLines.length; i += 2) {
  const batch = allLines.slice(i, i + 2);
  await Promise.all(batch.map((line) => synthesizeLine(line)));
}

const manifestIds = allLines.map((l) => l.id);
await writeFile(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifestIds, null, 2) + "\n",
);
console.log(`[narration] Wrote manifest.json with ${manifestIds.length} entries.`);
