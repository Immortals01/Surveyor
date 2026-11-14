import { useCallback, useEffect, useRef, useState } from "react";
import type { Machine, MachineTone } from "@/data/machines";
import { NARRATION_ASSET_VERSION } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

/**
 * Per-character narration.
 *
 * Every machine has its own voice profile. We prefer the pre-generated neural
 * MP3s (one file per sentence, voiced by a different edge-tts voice per
 * character). If a clip is missing we fall back to the best natural Web Speech
 * voice that matches the character's profile, then to a calm timed caption.
 *
 * Sentences are played one at a time so the text highlight and the character's
 * talking animation stay exactly in sync with the voice.
 */

const TONE_TUNING: Record<MachineTone, { rate: number; pitch: number }> = {
  excited: { rate: 0.06, pitch: 0.08 },
  proud: { rate: 0.01, pitch: 0.03 },
  warm: { rate: -0.03, pitch: 0.01 },
  calm: { rate: -0.02, pitch: 0 },
  curious: { rate: -0.01, pitch: 0.04 },
  thoughtful: { rate: -0.05, pitch: -0.01 },
  bittersweet: { rate: -0.08, pitch: -0.03 },
};

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

/** Stop any machine narration immediately (panel close, character switch, Escape). */
export function stopMachineNarration(): void {
  stopEverything();
}

function pickWebVoice(hints: string[]): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const usable = voices.filter(
    (v) => !/espeak|speechd|festival|mbrola/i.test(v.name),
  );
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

function speakSentence(
  machine: Machine,
  index: number,
  signal: AbortSignal,
): Promise<"ended" | "cancelled"> {
  const sentence = machine.story[index];
  if (!sentence) return Promise.resolve("ended");

  return new Promise((resolve) => {
    let settled = false;
    let audio: HTMLAudioElement | null = null;
    let timer = 0;
    const wordCount = sentence.text.trim().split(/\s+/).length;
    const fallbackMs = Math.max(2400, Math.min(9000, wordCount * 300));

    const finish = (result: "ended" | "cancelled") => {
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

    const afterSentence = () => {
      const wait = Math.max(0, machine.voice.pauseMs);
      timer = window.setTimeout(() => finish("ended"), wait);
    };

    const speechFallback = () => {
      const voice = pickWebVoice(machine.voice.webSpeechHints);
      if (!voice || typeof window === "undefined" || !("speechSynthesis" in window)) {
        timer = window.setTimeout(() => finish("ended"), fallbackMs);
        return;
      }
      const tuning = TONE_TUNING[sentence.tone] ?? { rate: 0, pitch: 0 };
      const utterance = new SpeechSynthesisUtterance(sentence.text);
      utterance.voice = voice;
      utterance.rate = Math.min(1.6, Math.max(0.6, machine.voice.webRate + tuning.rate));
      utterance.pitch = Math.min(1.8, Math.max(0.5, machine.voice.webPitch + tuning.pitch));
      utterance.volume = 0.92;
      utterance.onend = afterSentence;
      utterance.onerror = () => {
        timer = window.setTimeout(() => finish("ended"), fallbackMs);
      };
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        timer = window.setTimeout(() => finish("ended"), fallbackMs);
      }
    };

    const { muted, voiceEnabled } = useAppStore.getState().settings;
    if (muted || !voiceEnabled) {
      timer = window.setTimeout(() => finish("ended"), fallbackMs);
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    activeStop = onAbort;

    audio = new Audio(`${sentence.audio}?v=${NARRATION_ASSET_VERSION}`);
    audio.volume = 0.95;
    audio.onended = afterSentence;
    audio.onerror = () => {
      audio = null;
      speechFallback();
    };
    void audio.play().catch(() => {
      // Autoplay may be blocked until the visitor taps play; the dossier exposes
      // that control. Do not silently keep advancing the story.
      audio = null;
      finish("cancelled");
    });
  });
}

interface NarrationCallbacks {
  onSentence: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onFinished: () => void;
}

interface NarrationSession {
  abort: AbortController;
  index: number;
  paused: boolean;
}

export function useMachineNarration(machine: Machine | undefined) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const sessionRef = useRef<NarrationSession | null>(null);
  const callbacksRef = useRef<NarrationCallbacks | null>(null);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (session) {
      session.abort.abort();
      sessionRef.current = null;
    }
    stopEverything();
    setIsPlaying(false);
    setIsPaused(false);
    setIsFinished(false);
  }, []);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.abort.abort();
        sessionRef.current = null;
      }
      stopEverything();
    };
  }, [machine?.id]);

  const run = useCallback(
    async (startIndex: number) => {
      if (!machine) return;
      stopEverything();
      const previous = sessionRef.current;
      if (previous) previous.abort.abort();

      const abort = new AbortController();
      const session: NarrationSession = {
        abort,
        index: startIndex,
        paused: false,
      };
      sessionRef.current = session;
      callbacksRef.current = {
        onSentence: setActiveIndex,
        onPlayingChange: setIsPlaying,
        onFinished: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsFinished(true);
        },
      };
      setIsPlaying(true);
      setIsPaused(false);
      setIsFinished(false);

      for (let i = startIndex; i < machine.story.length; i++) {
        if (abort.signal.aborted) return;
        session.index = i;
        callbacksRef.current?.onSentence(i);
        const result = await speakSentence(machine, i, abort.signal);
        if (result === "cancelled" || abort.signal.aborted) {
          if (!abort.signal.aborted) {
            // Autoplay was blocked: leave the play button ready, not "finished".
            setIsPlaying(false);
            setIsPaused(true);
          }
          return;
        }
      }
      if (!abort.signal.aborted) {
        callbacksRef.current?.onFinished();
      }
    },
    [machine],
  );

  const play = useCallback(
    (fromSentence = 0) => {
      if (!machine) return;
      const session = sessionRef.current;
      if (
        session &&
        session.paused &&
        fromSentence === session.index &&
        isPaused
      ) {
        session.paused = false;
        setIsPaused(false);
        void run(session.index);
        return;
      }
      void run(fromSentence);
    },
    [isPaused, machine, run],
  );

  const pause = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.paused = true;
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

  return {
    activeIndex,
    isPlaying,
    isPaused,
    isFinished,
    play,
    pause,
    replay,
    stop,
    resume: () => {
      const session = sessionRef.current;
      if (session) play(session.index);
    },
  };
}
