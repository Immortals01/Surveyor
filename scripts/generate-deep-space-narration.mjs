#!/usr/bin/env bun
/**
 * Generate one neural-TTS clip per deep-space memory-log paragraph, so the story
 * panel can highlight the exact section being read. Voices come from
 * `src/audio/deepSpaceVoices.ts`, the same profile the runtime hook uses.
 *
 * Output: public/audio/deep-space/<object>-p<N>.mp3 (+ manifest.json)
 *
 * Usage: bun scripts/generate-deep-space-narration.mjs
 * Requires: edge-tts (or ~/.local/bin/edge-tts, or /tmp/tts-venv/bin/edge-tts) and ffmpeg.
 *
 * Without these clips the app still reads every log aloud through the browser's
 * best natural voice, with the same per-paragraph highlight.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { DEEP_SPACE_ENTRIES } from "../src/data/deepSpace.ts";
import {
  DEEP_SPACE_VOICES,
  deepSpaceParagraphAudio,
} from "../src/audio/deepSpaceVoices.ts";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/audio/deep-space");
mkdirSync(OUT_DIR, { recursive: true });

const LOCAL_EDGE_TTS = path.join(homedir(), ".local/bin/edge-tts");
const EDGE_TTS_BIN = existsSync("/tmp/tts-venv/bin/edge-tts")
  ? "/tmp/tts-venv/bin/edge-tts"
  : existsSync(LOCAL_EDGE_TTS)
    ? LOCAL_EDGE_TTS
    : "edge-tts";

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

async function synthesize(entry, paragraphIndex) {
  const voice = DEEP_SPACE_VOICES[entry.id];
  if (!voice) throw new Error(`no voice profile for deep-space object ${entry.id}`);

  const id = `${entry.id}-p${paragraphIndex + 1}`;
  const outMp3 = path.join(OUT_DIR, `${id}.mp3`);
  manifest.push({
    id,
    entryId: entry.id,
    voice: voice.voiceId,
    text: entry.story[paragraphIndex],
    audio: deepSpaceParagraphAudio(entry.id, paragraphIndex).split("?")[0],
  });
  if (existsSync(outMp3)) {
    skipped++;
    return;
  }

  const rate = formatPercent(voice.rate);
  const pitch = formatHz(voice.pitch);
  const raw = path.join(OUT_DIR, `${id}.raw.mp3`);

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await execFileAsync(EDGE_TTS_BIN, [
        "--voice",
        voice.voiceId,
        `--rate=${rate}`,
        `--pitch=${pitch}`,
        "--text",
        entry.story[paragraphIndex],
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
  console.log(`[deep-space-voice] ${entry.id} · ${id} · ${voice.voiceId} (${rate}, ${pitch})`);
  generated++;
}

const jobs = [];
for (const entry of DEEP_SPACE_ENTRIES) {
  for (let i = 0; i < entry.story.length; i++) jobs.push({ entry, paragraphIndex: i });
}

for (let i = 0; i < jobs.length; i += 3) {
  await Promise.all(
    jobs.slice(i, i + 3).map(({ entry, paragraphIndex }) => synthesize(entry, paragraphIndex)),
  );
}

manifest.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `[deep-space-voice] done: ${generated} new, ${skipped} existing, ${manifest.length} total.`,
);
