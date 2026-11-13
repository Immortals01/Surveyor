import type { LoRoMood } from "@/data/schema";
import { getHost, type HostId } from "@/data/hosts";
import LunarModuleMascot3D from "./LunarModuleMascot3D";
import SurveyorHost3D from "./SurveyorHost3D";
import SurveyorScout3D from "./SurveyorScout3D";

export interface HostMascot3DProps {
  hostId: HostId;
  mood: LoRoMood;
  isSpeaking: boolean;
  accent: string;
  reduceMotion: boolean;
}

/**
 * Picks the right cartoon rig for the host on stage:
 * - Surveyor 3 keeps its signature helmet + solar/dish hat
 * - Surveyor 1 and Surveyor 7 are tripod scouts with their own headgear
 * - Eagle, Intrepid and Antares are friendly lunar-module descent stages
 */
export default function HostMascot3D({
  hostId,
  mood,
  isSpeaking,
  accent,
  reduceMotion,
}: HostMascot3DProps) {
  const host = getHost(hostId);

  if (host.kind === "lm") {
    return (
      <LunarModuleMascot3D
        host={host}
        mood={mood}
        isSpeaking={isSpeaking}
        accent={accent}
        reduceMotion={reduceMotion}
      />
    );
  }

  if (hostId === "surveyor-3") {
    return (
      <SurveyorHost3D
        mood={mood}
        isSpeaking={isSpeaking}
        accent={accent}
        reduceMotion={reduceMotion}
      />
    );
  }

  return (
    <SurveyorScout3D
      host={host}
      mood={mood}
      isSpeaking={isSpeaking}
      accent={accent}
      reduceMotion={reduceMotion}
    />
  );
}
