import { NARRATION_ASSET_VERSION } from "@/lib/constants";

/**
 * Voice identities for the deep-space memory files.
 *
 * Pure data so both the runtime hook (`deepSpaceNarration.ts`) and the offline
 * generator (`scripts/generate-deep-space-narration.mjs`) read the same profile:
 * one edge-tts neural voice per object, plus the Web Speech fallback hints and
 * the pause the object takes between paragraphs.
 */
export interface DeepSpaceVoice {
  /** edge-tts neural voice used by the offline generator. */
  voiceId: string;
  /** Rate/pitch offsets in edge-tts units ("%"/"Hz") the generator applies. */
  rate: number;
  pitch: number;
  /** Breath between paragraphs, in milliseconds. */
  pauseMs: number;
  /** Browser voices to look for, most preferred first. */
  webSpeechHints: string[];
  webRate: number;
  webPitch: number;
}

export const DEEP_SPACE_VOICES: Record<string, DeepSpaceVoice> = {
  dawn: {
    voiceId: "en-IE-EmilyNeural",
    rate: -5,
    pitch: 1,
    pauseMs: 460,
    webSpeechHints: ["Moira", "Google UK English Female", "Emily", "Serena"],
    webRate: 0.91,
    webPitch: 1.0,
  },
  "near-shoemaker": {
    voiceId: "en-US-ChristopherNeural",
    rate: -7,
    pitch: -4,
    pauseMs: 420,
    webSpeechHints: ["Daniel", "Google US English", "Alex", "Christopher"],
    webRate: 0.92,
    webPitch: 0.9,
  },
  pioneer: {
    voiceId: "en-US-GuyNeural",
    rate: -6,
    pitch: -6,
    pauseMs: 440,
    webSpeechHints: ["David", "Google UK English Male", "Guy", "Alex"],
    webRate: 0.93,
    webPitch: 0.86,
  },
  kepler: {
    voiceId: "en-GB-SoniaNeural",
    rate: -8,
    pitch: -1,
    pauseMs: 400,
    webSpeechHints: ["Google UK English Female", "Serena", "Kate", "Sonia"],
    webRate: 0.9,
    webPitch: 0.97,
  },
};

const DEFAULT_VOICE: DeepSpaceVoice = {
  voiceId: "en-US-AriaNeural",
  rate: -4,
  pitch: 0,
  pauseMs: 400,
  webSpeechHints: ["Google US English", "Samantha", "Aria"],
  webRate: 0.94,
  webPitch: 1.0,
};

export function deepSpaceVoiceFor(entryId: string): DeepSpaceVoice {
  return DEEP_SPACE_VOICES[entryId] ?? DEFAULT_VOICE;
}

/** One clip per memory-log paragraph so the highlight follows the voice exactly. */
export function deepSpaceParagraphAudio(entryId: string, index: number): string {
  return `/audio/deep-space/${entryId}-p${index + 1}.mp3?v=${NARRATION_ASSET_VERSION}`;
}

/** Stable DOM id for the paragraph currently being read. */
export function deepSpaceParagraphDomId(entryId: string, index: number): string {
  return `deep-space-${entryId}-p${index}`;
}
