import type { LoRoMood } from "@/data/schema";

export interface MoodVisualSpec {
  label: string;
  irisColor: string;
  glowColor: string;
  browOffsetY: number;
  browTiltDeg: number;
  wingWaveDeg: number;
  bodyTiltDeg: number;
}

export const LORO_MOODS: Record<LoRoMood, MoodVisualSpec> = {
  waving: {
    label: "Greeting",
    irisColor: "#5ce1ff",
    glowColor: "#5ce1ff",
    browOffsetY: -3,
    browTiltDeg: -4,
    wingWaveDeg: 14,
    bodyTiltDeg: -4,
  },
  narrating: {
    label: "Sharing Story",
    irisColor: "#5ce1ff",
    glowColor: "#38bdf8",
    browOffsetY: 0,
    browTiltDeg: 0,
    wingWaveDeg: 3,
    bodyTiltDeg: 2,
  },
  scanning: {
    label: "Orbital Scan",
    irisColor: "#7ee787",
    glowColor: "#5ce1ff",
    browOffsetY: 1.5,
    browTiltDeg: 6,
    wingWaveDeg: 2,
    bodyTiltDeg: 9,
  },
  nostalgic: {
    label: "Memory Relay",
    irisColor: "#ffcf70",
    glowColor: "#ffcf70",
    browOffsetY: -1,
    browTiltDeg: -7,
    wingWaveDeg: 2,
    bodyTiltDeg: -3,
  },
  excited: {
    label: "Discovery!",
    irisColor: "#ffffff",
    glowColor: "#5ce1ff",
    browOffsetY: -5,
    browTiltDeg: 0,
    wingWaveDeg: 11,
    bodyTiltDeg: 0,
  },
};
