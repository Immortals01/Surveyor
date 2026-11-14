import type { HostCharacter } from "./hosts";
import type { DialogueLine, LunarSite } from "./schema";

/**
 * Surveyor 3's own introduction, spoken on the welcome screen.
 * Kept in `src/data/` so the narration generator can find and synthesize it.
 */
export const HOST_INTRO_MOON: DialogueLine = {
  id: "loro-self-intro-moon",
  speaker: "loro",
  mood: "waving",
  text: "Welcome! I'm Surveyor Three. When you're ready, choose the narrated tour and I'll fly you from site to site, or take free orbit and explore the Moon on your own.",
  sourceIds: ["S-NSSDCA-1967-035A", "S-NASA-SURVEYOR"],
};

export const HOST_INTRO_MARS: DialogueLine = {
  id: "loro-self-intro-mars",
  speaker: "loro",
  mood: "excited",
  text: "Welcome to Mars! I'm Surveyor Three. Choose the narrated tour and I'll guide you across the Red Planet, or take free orbit and wander the landing sites yourself.",
  sourceIds: ["S-NSSDCA-1975-075C", "S-HIRISE-HARDWARE"],
};

/**
 * Surveyor 3's site-specific commentary for the smaller secondary sites.
 * Kept here (rather than inside each site) so the narration generator can find
 * every line and synth one clip per site.
 */
export const SECONDARY_HOST_LINES: Record<string, DialogueLine> = {
  "surveyor-3": {
    id: "host-surveyor-3-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "nostalgic",
    text: "I'm Surveyor Three. I landed in Surveyor Crater in 1967 and dug the first robot trenches; Apollo 12 astronauts later carried my camera home.",
    sourceIds: ["S-NSSDCA-1967-035A", "S-NASA-SURVEYOR"],
  },
  "surveyor-5": {
    id: "host-surveyor-5-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm Surveyor Five. A helium leak nearly ended my trip, but controllers nursed me down in the Sea of Tranquility, where I tasted the soil.",
    sourceIds: ["S-NSSDCA-1967-084A", "S-NASA-SURVEYOR"],
  },
  "surveyor-6": {
    id: "host-surveyor-6-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm Surveyor Six. In November 1967 I became the first spacecraft to lift off from the Moon, hopping 2.4 metres and photographing my footprints.",
    sourceIds: ["S-NSSDCA-1967-112A", "S-NASA-SURVEYOR"],
  },
  "apollo-11-easep": {
    id: "host-apollo-11-easep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm the Apollo 11 EASEP. Buzz Aldrin set my seismometer and hundred-prism mirror beside Eagle; that mirror still bounces lasers back to Earth.",
    sourceIds: ["S-NSSDCA-1969-059C", "S-LLR-SCIENCE"],
  },
  "apollo-12-alsep": {
    id: "host-apollo-12-alsep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "nostalgic",
    text: "I'm the Apollo 12 ALSEP. A nuclear generator kept me awake through lunar nights from 1969 to 1977, listening for moonquakes near Surveyor Crater.",
    sourceIds: ["S-ALSEP-ARCHIVE", "S-NSSDCA-1969-099C"],
  },
  "apollo-14-alsep": {
    id: "host-apollo-14-alsep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm the Apollo 14 ALSEP. Alan Shepard and Edgar Mitchell hauled me across Fra Mauro on a handcart, then left me listening to the Moon.",
    sourceIds: ["S-NSSDCA-1971-008C", "S-ALSEP-ARCHIVE"],
  },
  "apollo-15-alsep": {
    id: "host-apollo-15-alsep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm the Apollo 15 ALSEP. In 1971 I drilled heat probes into Hadley Rille and watched the Moon's magnetic weather until the network went quiet.",
    sourceIds: ["S-NSSDCA-1971-063C", "S-ALSEP-ARCHIVE"],
  },
  "apollo-15-lrv": {
    id: "host-apollo-15-lrv-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm LRV-1, the first lunar rover. David Scott and Jim Irwin unfolded me from Falcon and drove me 27.8 kilometres along Hadley Rille.",
    sourceIds: ["S-NSSDCA-1971-063C", "S-WAGNER-2017"],
  },
  "apollo-16-alsep": {
    id: "host-apollo-16-alsep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm the Apollo 16 ALSEP. John Young and Charlie Duke set me in the Descartes highlands, adding a highland ear to the Moon's seismic network.",
    sourceIds: ["S-NSSDCA-1972-031C", "S-ALSEP-ARCHIVE"],
  },
  "apollo-16-lrv": {
    id: "host-apollo-16-lrv-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm LRV-2. I carried John Young and Charlie Duke 26.7 kilometres across the Descartes highlands, once hitting 18 kilometres an hour.",
    sourceIds: ["S-NSSDCA-1972-031C", "S-WAGNER-2017"],
  },
  "apollo-17-alsep": {
    id: "host-apollo-17-alsep-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm the last ALSEP, deployed at Taurus-Littrow in 1972. My heat probes, gravimeter and dust detector completed the network that mapped the Moon's inside.",
    sourceIds: ["S-NSSDCA-1972-096C", "S-ALSEP-ARCHIVE"],
  },
  "apollo-17-lrv": {
    id: "host-apollo-17-lrv-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "nostalgic",
    text: "I'm LRV-3, the last Moon buggy. Gene Cernan and Jack Schmitt drove me 35.9 kilometres and taped a map over my broken fender.",
    sourceIds: ["S-NSSDCA-1972-096C", "S-WAGNER-2017"],
  },
  "sojourner-rover": {
    id: "host-sojourner-rover-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm Sojourner, the first rover on Mars. I rolled off Pathfinder for a seven-sol mission and kept going for 83, tasting rocks around Ares Vallis.",
    sourceIds: ["S-NSSDCA-1996-068A", "S-NASA-PATHFINDER"],
  },
  "spirit-lander": {
    id: "host-spirit-lander-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "narrating",
    text: "I'm Columbia Memorial Station. I bounced into Gusev Crater in 2004 and opened my petals for Spirit. My bright panels still show from orbit.",
    sourceIds: ["S-NSSDCA-2003-027A", "S-HIRISE-HARDWARE"],
  },
  "opportunity-lander": {
    id: "host-opportunity-lander-site",
    speaker: "loro",
    speakerLabel: "SURVEYOR 3",
    mood: "excited",
    text: "I'm Challenger Memorial Station. I bounced 26 times across Meridiani Planum and landed in Eagle Crater, where Opportunity rolled onto hematite bedrock.",
    sourceIds: ["S-NSSDCA-2003-032A", "S-HIRISE-HARDWARE"],
  },
};


export const DEFAULT_MOON_TIP: DialogueLine = {
  id: "loro-tip-1",
  speaker: "loro",
  mood: "waving",
  text: "Click any glowing marker on the Moon—or open 'Index (20)' above—to swoop down and hear what our left-behind spacecraft remember!",
  sourceIds: ["S-SVS-4720", "S-WAGNER-2017"],
};

export const DEFAULT_MARS_TIP: DialogueLine = {
  id: "mars-tip-1",
  speaker: "loro",
  mood: "excited",
  text: "Down on the Golden Plains of Chryse Planitia sits the pioneer that started it all: Viking 1! Even from MRO's orbit, its bright triangular deck and nearby discarded backshell gleam against the rusty dust.",
  sourceIds: ["S-NSSDCA-1975-075C", "S-HIRISE-HARDWARE"],
};

/**
 * The exact line the active host will speak for a site. Shared by the callout
 * box, the host click handler, and the tour so text and audio always agree.
 */
export function resolveHostLine(
  selectedSite: LunarSite | undefined,
  host: HostCharacter,
  isMars: boolean,
): DialogueLine {
  if (!selectedSite) {
    return isMars ? DEFAULT_MARS_TIP : DEFAULT_MOON_TIP;
  }
  if (host.siteId === selectedSite.id) {
    return host.intro;
  }
  if (selectedSite.tier === "hero") {
    return selectedSite.loroIntro;
  }
  const secondaryLine = SECONDARY_HOST_LINES[selectedSite.id];
  if (secondaryLine) return secondaryLine;
  if (host.id !== "surveyor-3") return host.intro;
  return isMars ? DEFAULT_MARS_TIP : DEFAULT_MOON_TIP;
}
