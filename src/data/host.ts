import type { DialogueLine } from "./schema";

/**
 * Surveyor 3's own introduction, spoken on the welcome screen.
 * Kept in `src/data/` so the narration generator can find and synthesize it.
 */
export const HOST_INTRO_MOON: DialogueLine = {
  id: "loro-self-intro-moon",
  speaker: "loro",
  mood: "waving",
  text: "Hello, I'm Surveyor 3, your lunar host. I soft-landed in the Ocean of Storms in April 1967, and thirty-one months later Pete Conrad and Alan Bean walked over from Intrepid to visit me. Twenty spacecraft still rest up here. Take the tour, or fly free and pick a marker.",
  sourceIds: ["S-NSSDCA-1967-035A", "S-NASA-SURVEYOR"],
};

export const HOST_INTRO_MARS: DialogueLine = {
  id: "loro-self-intro-mars",
  speaker: "loro",
  mood: "excited",
  text: "I'm Surveyor 3, your host — still parked on the Moon, but relaying Mars pictures from orbit. Eleven robotic pioneers rest on the red plains below, from Viking 1 to Ingenuity. Take the guided tour, or fly free and pick a marker.",
  sourceIds: ["S-NSSDCA-1975-075C", "S-HIRISE-HARDWARE"],
};
