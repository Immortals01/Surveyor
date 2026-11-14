import { useCallback, useEffect, useRef, useState } from "react";
import type { DeepSpaceEntry } from "@/data/deepSpace";
import { useAppStore } from "@/store/useAppStore";
import {
  deepSpaceParagraphAudio,
  deepSpaceVoiceFor,
  type DeepSpaceVoice,
} from "./deepSpaceVoices";

/**
 * Narration for a deep-space memory file.
 *
 * The log is read one paragraph at a time so the highlighted section and the
 * voice can never drift apart. Each paragraph prefers its pre-generated neural
 * clip (`/audio/deep-space/<id>-p<N>.mp3`), falls back to the best natural
 * Web Speech voice, then to a calm timed caption when muted or when only
 * robotic voices are installed.
 */

let activeStop: (() => void) | null = null;

function stopEverything() {
  if (activeStop) {
    const stop = activeStop;
    activeStop = null;
    stop();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/** Stop narration immediately (panel close, object change, Escape). */
export function stopDeepSpaceNarration(): void {
  stopEverything();
}

function pickWebVoice(hints: string[]): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const usable = voices.filter((v) => !/espeak|speechd|festival|mbrola/i.test(v.name));
  for (const hint of hints) {
    const match = usable.find(
      (v) => v.name.toLowerCase().includes(hint.toLowerCase()) && v.lang.startsWith("en"),
    );
    if (match) return match;
  }
  return (
    usable.find((v) => v.lang.startsWith("en") && /natural|neural|online/i.test(v.name)) ??
    usable.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

type ParagraphResult = "ended" | "cancelled" | "blocked";

function speakParagraph(
  entry: DeepSpaceEntry,
  index: number,
  signal: AbortSignal,
): Promise<ParagraphResult> {
  const paragraph = entry.story[index];
  if (!paragraph) return Promise.resolve("ended");

  const voice: DeepSpaceVoice = deepSpaceVoiceFor(entry.id);
  const wordCount = paragraph.trim().split(/\s+/).length;
  const captionMs = Math.max(2600, Math.min(9000, wordCount * 300));

  return new Promise((resolve) => {
    let settled = false;
    let audio: HTMLAudioElement | null = null;
    let timer = 0;

    const finish = (result: ParagraphResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.src = "";
      }
      activeStop = null;
      resolve(result);
    };
    const onAbort = () => finish("cancelled");

    const afterParagraph = () => {
      timer = window.setTimeout(() => finish("ended"), Math.max(0, voice.pauseMs));
    };

    const caption = () => {
      timer = window.setTimeout(() => finish("ended"), captionMs);
    };

    const speechFallback = () => {
      const webVoice = pickWebVoice(voice.webSpeechHints);
      if (!webVoice || typeof window === "undefined" || !("speechSynthesis" in window)) {
        caption();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(paragraph);
      utterance.voice = webVoice;
      utterance.rate = Math.min(1.6, Math.max(0.6, voice.webRate));
      utterance.pitch = Math.min(1.8, Math.max(0.5, voice.webPitch));
      utterance.volume = 0.92;
      utterance.onend = afterParagraph;
      utterance.onerror = caption;
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        caption();
      }
    };

    const { muted, voiceEnabled } = useAppStore.getState().settings;
    if (muted || !voiceEnabled) {
      caption();
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    activeStop = onAbort;

    audio = new Audio(deepSpaceParagraphAudio(entry.id, index));
    audio.volume = 0.95;
    audio.onended = afterParagraph;
    audio.onerror = () => {
      audio = null;
      speechFallback();
    };
    void audio.play().catch(() => {
      // Browsers block audio until the visitor has interacted. Leave the panel
      // paused with its Listen button ready instead of silently skipping ahead.
      audio = null;
      finish("blocked");
    });
  });
}

interface NarrationSession {
  abort: AbortController;
  index: number;
}

export function useDeepSpaceNarration(
  entry: DeepSpaceEntry | null,
  options: { autoPlay?: boolean } = {},
) {
  const autoPlay = options.autoPlay ?? true;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const sessionRef = useRef<NarrationSession | null>(null);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (session) {
      session.abort.abort();
      sessionRef.current = null;
    }
    stopEverything();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const run = useCallback(
    async (startIndex: number) => {
      if (!entry) return;
      stopEverything();
      const previous = sessionRef.current;
      if (previous) previous.abort.abort();

      const abort = new AbortController();
      sessionRef.current = { abort, index: startIndex };
      setIsPlaying(true);
      setIsPaused(false);
      setIsFinished(false);

      for (let i = startIndex; i < entry.story.length; i++) {
        if (abort.signal.aborted) return;
        setActiveIndex(i);
        const result = await speakParagraph(entry, i, abort.signal);
        if (result === "cancelled" || abort.signal.aborted) return;
        if (result === "blocked") {
          setIsPlaying(false);
          setIsPaused(true);
          return;
        }
      }
      if (!abort.signal.aborted) {
        setIsPlaying(false);
        setIsPaused(false);
        setIsFinished(true);
      }
    },
    [entry],
  );

  const play = useCallback(
    (fromParagraph = 0) => {
      void run(fromParagraph);
    },
    [run],
  );

  const pause = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.abort.abort();
    sessionRef.current = null;
    stopEverything();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const replay = useCallback(() => {
    setActiveIndex(-1);
    void run(0);
  }, [run]);

  // Read the log as soon as the file opens, and never carry a voice across objects.
  useEffect(() => {
    if (!entry) return;
    setActiveIndex(-1);
    setIsFinished(false);
    if (!autoPlay) return;
    void run(0);
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.abort.abort();
        sessionRef.current = null;
      }
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id, autoPlay]);

  return {
    activeIndex,
    isPlaying,
    isPaused,
    isFinished,
    play,
    pause,
    replay,
    stop,
  };
}
