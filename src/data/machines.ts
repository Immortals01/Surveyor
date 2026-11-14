import { z } from "zod";
import rawMachines from "./machines.json";

/**
 * The machine cast — one first-person narrator per piece of hardware.
 *
 * Content lives in `machines.json` so writers can edit stories, facts and
 * credits without touching React. Coordinates are the real landing/arrival
 * sites; `body: "belt"` marks Dawn as an "elsewhere" object in the asteroid belt.
 */

export const MachineBodySchema = z.enum(["moon", "mars", "belt"]);
export type MachineBody = z.infer<typeof MachineBodySchema>;

export const MachineToneSchema = z.enum([
  "excited",
  "proud",
  "warm",
  "calm",
  "curious",
  "thoughtful",
  "bittersweet",
]);
export type MachineTone = z.infer<typeof MachineToneSchema>;

const VoiceSchema = z.object({
  voiceId: z.string(),
  label: z.string(),
  rate: z.string(),
  pitch: z.string(),
  pauseMs: z.number().int().min(0).max(2000),
  webSpeechHints: z.array(z.string()).min(1),
  webPitch: z.number(),
  webRate: z.number(),
  personality: z.string(),
});

const StorySentenceSchema = z.object({
  id: z.string(),
  tone: MachineToneSchema,
  text: z.string().min(1),
  audio: z.string().startsWith("/"),
});

const GalleryImageSchema = z.object({
  src: z.string().startsWith("/"),
  caption: z.string(),
  credit: z.string(),
  nasaId: z.string(),
  year: z.number().int(),
});

const TimelineItemSchema = z.object({
  date: z.string(),
  title: z.string(),
  detail: z.string(),
});

const MachineSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  siteId: z.string().nullable(),
  name: z.string(),
  fullName: z.string(),
  category: z.string(),
  categoryLabel: z.string(),
  tagline: z.string(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  modelKey: z.string(),
  body: MachineBodySchema,
  placement: z.object({
    bodyLabel: z.string(),
    region: z.string(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    elsewhere: z.boolean(),
    coordinatesLabel: z.string(),
  }),
  launch: z.object({
    date: z.string(),
    site: z.string(),
    vehicle: z.string(),
  }),
  arrivals: z.array(
    z.object({ date: z.string(), site: z.string(), label: z.string() }),
  ).min(1),
  status: z.object({
    state: z.string(),
    date: z.string(),
    detail: z.string(),
  }),
  voice: VoiceSchema,
  story: z.array(StorySentenceSchema).min(4),
  purpose: z.object({
    why: z.string(),
    science: z.string(),
    instruments: z.array(z.string()).min(2),
    discoveries: z.array(z.string()).min(2),
    impact: z.string(),
  }),
  gallery: z.array(GalleryImageSchema).min(2),
  timeline: z.array(TimelineItemSchema).min(3),
  facts: z.array(z.string()).min(3),
  links: z.array(
    z.object({
      label: z.string(),
      url: z.string().url(),
      sourceId: z.string().optional(),
    }),
  ).min(1),
  sourceIds: z.array(z.string()).min(1),
});

export type Machine = z.infer<typeof MachineSchema>;

const parsed = z
  .object({ version: z.number(), cast: z.array(MachineSchema).min(1) })
  .parse(rawMachines);

export const MACHINES: readonly Machine[] = parsed.cast;

export const MACHINE_BY_ID: ReadonlyMap<string, Machine> = new Map(
  MACHINES.map((machine) => [machine.id, machine]),
);

export const MACHINE_IDS: readonly string[] = MACHINES.map((m) => m.id);

export function getMachine(id: string | null | undefined): Machine | undefined {
  if (!id) return undefined;
  return MACHINE_BY_ID.get(id);
}

export function getMachinesForBody(body: MachineBody): readonly Machine[] {
  if (body === "belt") return MACHINES.filter((m) => m.body === "belt");
  return MACHINES.filter((m) => m.body === body);
}

/** Machines whose map marker sits on one of the existing lunar/Mars site IDs. */
export function getMachineForSite(siteId: string | null | undefined): Machine | undefined {
  if (!siteId) return undefined;
  return MACHINES.find((machine) => machine.siteId === siteId);
}

export function getStoryText(machine: Machine): string {
  return machine.story.map((sentence) => sentence.text).join(" ");
}

export function getStoryWordCount(machine: Machine): number {
  return getStoryText(machine).trim().split(/\s+/).length;
}

export const MACHINE_TABS = [
  { id: "story", label: "Story" },
  { id: "science", label: "Purpose & Science" },
  { id: "pictures", label: "Pictures" },
  { id: "facts", label: "Facts & Timeline" },
  { id: "more", label: "More" },
] as const;

export type MachineTab = (typeof MACHINE_TABS)[number]["id"];
