#!/usr/bin/env bun
/**
 * Generate one neural-TTS clip per story sentence, so the dossier can highlight
 * the exact sentence being spoken and insert the character's own pause between
 * lines. Every machine uses a different edge-tts neural voice.
 *
 * Usage: bun scripts/generate-machine-narration.mjs
 * Requires: edge-tts (or /tmp/tts-venv/bin/edge-tts) and ffmpeg.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/audio/machines");
mkdirSync(OUT_DIR, { recursive: true });

const LOCAL_EDGE_TTS = path.join(homedir(), ".local/bin/edge-tts");
const EDGE_TTS_BIN = existsSync("/tmp/tts-venv/bin/edge-tts")
  ? "/tmp/tts-venv/bin/edge-tts"
  : existsSync(LOCAL_EDGE_TTS)
    ? LOCAL_EDGE_TTS
    : "edge-tts";

const data = JSON.parse(await readFile(path.join(ROOT, "src/data/machines.json"), "utf8"));

/** Small emotional rate/pitch shifts layered on each character's base profile. */
const TONES = {
  excited: { rate: 5, pitch: 7 },
  proud: { rate: 1, pitch: 2 },
  warm: { rate: -3, pitch: 1 },
  calm: { rate: -2, pitch: 0 },
  curious: { rate: -1, pitch: 3 },
  thoughtful: { rate: -5, pitch: -1 },
  bittersweet: { rate: -7, pitch: -3 },
};

function parseSetting(value, fallback = 0) {
  const match = String(value ?? "").match(/-?\d+/);
  return match ? Number(match[0]) : fallback;
}

function formatPercent(value) {
  const clamped = Math.max(-40, Math.min(40, Math.round(value)));
  return `${clamped >= 0 ? "+" : ""}${clamped}%`;
}

function formatHz(value) {
  const clamped = Math.max(-40, Math.min(40, Math.round(value)));
  return `${clamped >= 0 ? "+" : ""}${clamped}Hz`;
}

let generated = 0;
let skipped = 0;
const manifest = [];

async function synthesize(machine, sentence) {
  const outMp3 = path.join(OUT_DIR, `${sentence.id}.mp3`);
  manifest.push({
    id: sentence.id,
    machineId: machine.id,
    voice: machine.voice.voiceId,
    audio: sentence.audio,
  });
  if (existsSync(outMp3)) {
    skipped++;
    return;
  }

  const tone = TONES[sentence.tone] ?? { rate: 0, pitch: 0 };
  const rate = formatPercent(parseSetting(machine.voice.rate) + tone.rate);
  const pitch = formatHz(parseSetting(machine.voice.pitch) + tone.pitch);
  const raw = path.join(OUT_DIR, `${sentence.id}.raw.mp3`);

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await execFileAsync(EDGE_TTS_BIN, [
        "--voice",
        machine.voice.voiceId,
        `--rate=${rate}`,
        `--pitch=${pitch}`,
        "--text",
        sentence.text,
        "--write-media",
        raw,
      ]);
      break;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }

  const filter =
    "highpass=f=95,acompressor=threshold=-18dB:ratio=2:attack=15:release=180,volume=0.95";
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    raw,
    "-af",
    filter,
    "-ac",
    "1",
    "-ar",
    "24000",
    "-b:a",
    "48k",
    outMp3,
  ]);
  await unlink(raw).catch(() => {});
  console.log(`[machine-voice] ${machine.id} · ${sentence.id} · ${machine.voice.voiceId} (${rate}, ${pitch})`);
  generated++;
}

const jobs = [];
for (const machine of data.cast) {
  for (const sentence of machine.story) jobs.push({ machine, sentence });
}

for (let i = 0; i < jobs.length; i += 3) {
  await Promise.all(jobs.slice(i, i + 3).map(({ machine, sentence }) => synthesize(machine, sentence)));
}

manifest.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`[machine-voice] done: ${generated} new, ${skipped} existing, ${manifest.length} total.`);
