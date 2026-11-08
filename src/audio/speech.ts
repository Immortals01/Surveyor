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
 * 1. Pre-generated neural TTS MP3 in /audio/narration/<id>.mp3 (warm, natural studio voice)
 * 2. High-quality neural browser Web Speech API voice (rejects robotic espeak/Linux synth)
 * 3. Comfortable silent caption timer when muted or only robotic TTS is installed
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
      const played = await playMp3(`/audio/narration/${line.id}.mp3`, signal);
      if (played) return;
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

function playMp3(url: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 0.88;
    const unregister = audioEngine.registerVoiceAudio(audio);

    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      unregister();
      audio.pause();
      audio.src = "";
      activeCancel = null;
      resolve(ok);
    };

    activeCancel = () => finish(true);
    signal?.addEventListener("abort", () => finish(true), { once: true });
    audio.addEventListener("ended", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false), { once: true });
    void audio.play().catch(() => finish(false));
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

  // Only use genuinely natural/high-quality voices; never fall back to robotic Linux espeak/festival
  const naturalVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith("en") &&
      /natural|neural|online|premium|samantha|ava|aria|google us english/i.test(
        v.name,
      ) &&
      !/espeak|speechd|festival|mbrola/i.test(v.name),
  );

  if (!naturalVoice) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.voice = naturalVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

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
