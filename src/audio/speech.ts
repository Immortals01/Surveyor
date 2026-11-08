import type { DialogueLine } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";
import { audioEngine } from "./AudioEngine";

let activeCancel: (() => void) | null = null;
let cachedManifest: Set<string> | null = null;

async function getNarrationManifest(): Promise<Set<string>> {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch("/audio/narration/manifest.json");
    if (res.ok) {
      const list = (await res.json()) as string[];
      cachedManifest = new Set(list);
      return cachedManifest;
    }
  } catch {
    // optional pre-generated manifest
  }
  cachedManifest = new Set();
  return cachedManifest;
}

export function cancelSpeech(): void {
  if (activeCancel) {
    const fn = activeCancel;
    activeCancel = null;
    fn();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  audioEngine.setVoiceActive(false);
}

/**
 * 3-tier narration playback:
 * 1. Pre-generated /audio/narration/<id>.mp3 if listed in manifest
 * 2. Browser Web Speech API with watchdog timeout (never hangs!)
 * 3. Comfortable silent caption timer when muted or TTS unavailable
 */
export async function speakLine(
  line: DialogueLine,
  signal?: AbortSignal,
): Promise<void> {
  cancelSpeech();
  if (signal?.aborted) return;

  const { muted, voiceEnabled } = useAppStore.getState().settings;
  const wordCount = line.text.trim().split(/\s+/).length;
  const silentReadMs = Math.max(2800, Math.min(8500, wordCount * 290));

  if (muted || !voiceEnabled) {
    await waitMs(silentReadMs, signal);
    return;
  }

  audioEngine.setVoiceActive(true);
  if (line.speaker === "equipment") {
    audioEngine.playQuindar("intro");
  }

  try {
    const manifest = await getNarrationManifest();
    if (signal?.aborted) return;

    if (manifest.has(line.id)) {
      await playMp3(`/audio/narration/${line.id}.mp3`, signal);
      return;
    }

    const spokeViaTts = await tryWebSpeech(line, wordCount, signal);
    if (!spokeViaTts && !signal?.aborted) {
      await waitMs(silentReadMs, signal);
    }
  } finally {
    if (!signal?.aborted && line.speaker === "equipment") {
      audioEngine.playQuindar("outro");
    }
    audioEngine.setVoiceActive(false);
  }
}

function waitMs(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = window.setTimeout(() => {
      activeCancel = null;
      resolve();
    }, ms);
    const abort = () => {
      window.clearTimeout(id);
      resolve();
    };
    activeCancel = abort;
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function playMp3(url: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    const finish = () => {
      audio.pause();
      activeCancel = null;
      resolve();
    };
    activeCancel = finish;
    signal?.addEventListener("abort", finish, { once: true });
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    void audio.play().catch(finish);
  });
}

function tryWebSpeech(
  line: DialogueLine,
  wordCount: number,
  signal?: AbortSignal,
): Promise<boolean> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve(false);
  }

  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length === 0) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;
    const utterance = new SpeechSynthesisUtterance(line.text);

    const englishVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith("en"),
    );
    const preferred =
      englishVoices.find((v) => /natural|neural|google|samantha/i.test(v.name)) ??
      englishVoices[0] ??
      voices[0];
    if (preferred) utterance.voice = preferred;

    if (line.speaker === "loro") {
      utterance.rate = 1.03;
      utterance.pitch = 1.08;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
    }

    const watchdogMs = Math.max(4000, wordCount * 480 + 2400);
    const timer = window.setTimeout(() => done(true), watchdogMs);

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      activeCancel = null;
      try {
        synth.cancel();
      } catch {
        // ignore
      }
      resolve(ok);
    };

    activeCancel = () => done(true);
    signal?.addEventListener("abort", () => done(true), { once: true });

    utterance.onend = () => done(true);
    utterance.onerror = () => done(false);

    try {
      synth.cancel();
      synth.speak(utterance);
    } catch {
      done(false);
    }
  });
}
