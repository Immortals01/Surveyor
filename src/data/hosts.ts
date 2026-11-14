import type { DialogueLine } from "@/data/schema";

/**
 * The cast of cartoon hardware hosts.
 *
 * Surveyor 3 is the mission's navigator and stays on stage as the default voice.
 * Whenever the tour arrives at Surveyor 1, Surveyor 7, Tranquility Base, Intrepid
 * or Antares, that site's own machine takes over the mascot stage and introduces
 * itself in the first person before the story continues.
 */

export type HostKind = "surveyor" | "lm";

export type HostId =
  | "surveyor-3"
  | "surveyor-1"
  | "surveyor-7"
  | "eagle"
  | "intrepid"
  | "antares";

/** Headgear silhouette for the little tripod robot hosts. */
export type SurveyorHeadgear = "solar-dish" | "dish" | "mast-scoop";

export interface HostCharacter {
  id: HostId;
  /** Short name shown on the stage plate. */
  name: string;
  /** Telemetry-style call sign used as the dialogue speaker label. */
  callSign: string;
  /** One-line role, used for tooltips and accessible labels. */
  role: string;
  /** Site this host belongs to, or null for the roaming navigator. */
  siteId: string | null;
  kind: HostKind;
  /** Glowing LED face / trim accent. */
  accent: string;
  /** Glossy outer shell (or base hull tint for lunar modules). */
  shell: string;
  /** Thermal foil tint. */
  foil: string;
  /** Metal / joint trim. */
  trim: string;
  headgear: SurveyorHeadgear;
  /** First-person introduction: who they are and a little history. */
  intro: DialogueLine;
}

const SURVEYOR_ACCENT = "#5ce1ff";

export const HOSTS: Record<HostId, HostCharacter> = {
  "surveyor-3": {
    id: "surveyor-3",
    name: "Surveyor 3",
    callSign: "SURVEYOR 3",
    role: "Lunar host and mission navigator",
    siteId: null,
    kind: "surveyor",
    accent: SURVEYOR_ACCENT,
    shell: "#f2f6fc",
    foil: "#e6b43c",
    trim: "#49658c",
    headgear: "solar-dish",
    intro: {
      id: "host-surveyor-3-intro",
      speaker: "equipment",
      speakerLabel: "SURVEYOR 3",
      mood: "nostalgic",
      text: "I'm Surveyor 3, and I've been waiting in Surveyor Crater since April 1967. Apollo 12 landed right beside me two and a half years later, and Pete and Alan carried my camera home so engineers could see what the Moon does to a machine. I'll be your guide tonight.",
      sourceIds: ["S-NSSDCA-1967-035A", "S-NASA-SURVEYOR"],
    },
  },

  "surveyor-1": {
    id: "surveyor-1",
    name: "Surveyor 1",
    callSign: "SURVEYOR 1",
    role: "First soft landing on the Moon",
    siteId: "surveyor-1",
    kind: "surveyor",
    accent: "#8ee7ff",
    shell: "#f7f3e8",
    foil: "#d8c06a",
    trim: "#c08a4e",
    headgear: "dish",
    intro: {
      id: "host-surveyor-1-intro",
      speaker: "equipment",
      speakerLabel: "SURVEYOR 1",
      mood: "excited",
      text: "Surveyor 1 here. In June 1966 I made the Moon's first soft landing, sending home 11,237 pictures that proved the dust could hold a lander.",
      sourceIds: ["S-NSSDCA-1966-045A", "S-NASA-SURVEYOR"],
    },
  },

  "surveyor-7": {
    id: "surveyor-7",
    name: "Surveyor 7",
    callSign: "SURVEYOR 7",
    role: "The last Surveyor scout, at Tycho",
    siteId: "surveyor-7",
    kind: "surveyor",
    accent: "#ffc27a",
    shell: "#eef2f8",
    foil: "#e0a94a",
    trim: "#8a6bb0",
    headgear: "mast-scoop",
    intro: {
      id: "host-surveyor-7-intro",
      speaker: "equipment",
      speakerLabel: "SURVEYOR 7",
      mood: "excited",
      text: "I'm Surveyor 7, the last and boldest scout. In January 1968 I landed on Tycho's rocky ejecta, dug into the highlands and tasted the soil.",
      sourceIds: ["S-NSSDCA-1968-001A", "S-NASA-SURVEYOR"],
    },
  },

  eagle: {
    id: "eagle",
    name: "Eagle",
    callSign: "EAGLE",
    role: "Apollo 11 lunar module descent stage",
    siteId: "apollo-11",
    kind: "lm",
    accent: "#7ee0ff",
    shell: "#e9edf4",
    foil: "#d9ab3e",
    trim: "#b9c7da",
    headgear: "dish",
    intro: {
      id: "host-eagle-intro",
      speaker: "equipment",
      speakerLabel: "EAGLE",
      mood: "nostalgic",
      text: "I'm Eagle. In July 1969 I carried Neil Armstrong and Buzz Aldrin down to Tranquility Base, then became their launch pad for the trip home.",
      sourceIds: ["S-NSSDCA-1969-059C", "S-LLR-SCIENCE", "S-3D-LM"],
    },
  },

  intrepid: {
    id: "intrepid",
    name: "Intrepid",
    callSign: "INTREPID",
    role: "Apollo 12 lunar module descent stage",
    siteId: "apollo-12",
    kind: "lm",
    accent: "#8be0c0",
    shell: "#e6eadf",
    foil: "#cfa23a",
    trim: "#a9bccc",
    headgear: "dish",
    intro: {
      id: "host-intrepid-intro",
      speaker: "equipment",
      speakerLabel: "INTREPID",
      mood: "excited",
      text: "I'm Intrepid. In November 1969 I made the first pinpoint Moon landing, setting Pete Conrad and Alan Bean beside old Surveyor 3.",
      sourceIds: ["S-NSSDCA-1969-099C", "S-NSSDCA-1967-035A", "S-3D-LM"],
    },
  },

  antares: {
    id: "antares",
    name: "Antares",
    callSign: "ANTARES",
    role: "Apollo 14 lunar module descent stage",
    siteId: "apollo-14",
    kind: "lm",
    accent: "#ffcf70",
    shell: "#ece6d6",
    foil: "#e0b455",
    trim: "#c9d4e2",
    headgear: "dish",
    intro: {
      id: "host-antares-intro",
      speaker: "equipment",
      speakerLabel: "ANTARES",
      mood: "narrating",
      text: "I'm Antares. In February 1971 I delivered Alan Shepard and Edgar Mitchell to Fra Mauro's ancient highlands, where they left a seismometer and a handcart.",
      sourceIds: ["S-NSSDCA-1971-008C", "S-ALSEP-ARCHIVE", "S-3D-LM"],
    },
  },
};

/** Every host on stage rotation, with the navigator first. */
export const HOST_ORDER: readonly HostId[] = [
  "surveyor-3",
  "surveyor-1",
  "surveyor-7",
  "eagle",
  "intrepid",
  "antares",
];

/** Sites that put their own machine on the mascot stage. */
export const HOST_BY_SITE: Readonly<Record<string, HostId>> = {
  "surveyor-1": "surveyor-1",
  "surveyor-7": "surveyor-7",
  "apollo-11": "eagle",
  "apollo-12": "intrepid",
  "apollo-14": "antares",
};

export const DEFAULT_HOST: HostId = "surveyor-3";

/** Pick the host that belongs to a selected site, falling back to Surveyor 3. */
export function resolveHostForSite(siteId: string | null | undefined): HostId {
  if (!siteId) return DEFAULT_HOST;
  return HOST_BY_SITE[siteId] ?? DEFAULT_HOST;
}

export function getHost(id: HostId): HostCharacter {
  return HOSTS[id];
}
