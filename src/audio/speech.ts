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
 *
 * Returns `true` if the line finished naturally, or `false` if interrupted by
 * `cancelSpeech()` or `signal` abort.
 */
export async function speakLine(
  line: DialogueLine,
  signal?: AbortSignal,
): Promise<boolean> {
  cancelSpeech();
  if (signal?.aborted) return false;

  const { muted, voiceEnabled } = useAppStore.getState().settings;
  const wordCount = line.text.trim().split(/\s+/).length;
  const silentReadMs = Math.max(2800, Math.min(8500, wordCount * 290));

  if (muted || !voiceEnabled) {
    return waitMs(silentReadMs, signal);
  }

  audioEngine.setVoiceActive(true);
  if (line.speaker === "equipment") {
    audioEngine.playQuindar("intro");
  }

  let cancelled = false;
  activeCancel = () => {
    cancelled = true;
  };
  try {
    const manifest = await getNarrationManifest();
    if (signal?.aborted || cancelled) {
      cancelled = true;
      return false;
    }

    if (manifest.has(line.id)) {
      const res = await playMp3(`/audio/narration/${line.id}.mp3`, signal);
      if (res === "cancelled" || signal?.aborted) {
        cancelled = true;
        return false;
      }
      if (res === "played") return true;
    }

    const ttsRes = await tryWebSpeech(line, wordCount, signal);
    if (ttsRes === "cancelled" || signal?.aborted) {
      cancelled = true;
      return false;
    }
    if (ttsRes === "unavailable") {
      const completedWait = await waitMs(silentReadMs, signal);
      if (!completedWait) {
        cancelled = true;
        return false;
      }
    }
    return !signal?.aborted;
  } finally {
    if (!signal?.aborted && !cancelled && line.speaker === "equipment") {
      audioEngine.playQuindar("outro");
    }
    audioEngine.setVoiceActive(false);
  }
}

function waitMs(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const id = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      activeCancel = null;
      resolve(true);
    }, ms);
    const abort = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(id);
      activeCancel = null;
      resolve(false);
    };
    activeCancel = abort;
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function playMp3(
  url: string,
  signal?: AbortSignal,
): Promise<"played" | "cancelled" | "error"> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 0.88;
    const unregister = audioEngine.registerVoiceAudio(audio);

    let done = false;
    const finish = (result: "played" | "cancelled" | "error") => {
      if (done) return;
      done = true;
      unregister();
      audio.pause();
      audio.src = "";
      activeCancel = null;
      resolve(result);
    };

    activeCancel = () => finish("cancelled");
    signal?.addEventListener("abort", () => finish("cancelled"), { once: true });
    audio.addEventListener("ended", () => finish("played"), { once: true });
    audio.addEventListener("error", () => finish("error"), { once: true });
    void audio.play().catch(() => finish("error"));
  });
}

function tryWebSpeech(
  line: DialogueLine,
  wordCount: number,
  signal?: AbortSignal,
): Promise<"played" | "cancelled" | "unavailable"> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve("unavailable");
  }

  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length === 0) {
    return Promise.resolve("unavailable");
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
    return Promise.resolve("unavailable");
  }

  return new Promise((resolve) => {
    let settled = false;
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.voice = naturalVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const watchdogMs = Math.max(4000, wordCount * 480 + 2400);
    const timer = window.setTimeout(() => done("played"), watchdogMs);

    const done = (result: "played" | "cancelled" | "unavailable") => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      activeCancel = null;
      try {
        synth.cancel();
      } catch {
        // ignore
      }
      resolve(result);
    };

    activeCancel = () => done("cancelled");
    signal?.addEventListener("abort", () => done("cancelled"), { once: true });

    utterance.onend = () => done("played");
    utterance.onerror = () => done("unavailable");

    try {
      synth.cancel();
      synth.speak(utterance);
    } catch {
      done("unavailable");
    }
  });
}
