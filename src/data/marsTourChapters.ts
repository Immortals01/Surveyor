import { MARS_HERO_SITES } from "./marsHeroSites";
import type { TourChapter } from "./schema";

function marsHeroById(id: string) {
  const site = MARS_HERO_SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Missing Mars hero site: ${id}`);
  return site;
}

const viking1 = marsHeroById("viking-1");
const viking2 = marsHeroById("viking-2");
const pathfinder = marsHeroById("mars-pathfinder");
const spirit = marsHeroById("spirit-rover");
const opportunity = marsHeroById("opportunity-rover");
const phoenix = marsHeroById("phoenix-lander");
const insight = marsHeroById("insight-lander");
const ingenuity = marsHeroById("ingenuity-helicopter");

export const MARS_TOUR_CHAPTERS: TourChapter[] = [
  {
    id: "mars-ch1-first-landers",
    number: 1,
    title: "Chapter 1: The First Landers",
    shortTitle: "1 · Vikings",
    subtitle:
      "How Viking 1 and Viking 2 sent home the first pictures from the surface of Mars",
    heroSiteIds: ["viking-1", "viking-2"],
    beats: [
      {
        kind: "flySite",
        siteId: "viking-1",
        sunLon: -70,
        announce: viking1.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "viking-2",
        sunLon: 110,
        sunLat: 18,
        announce: viking2.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch2-microrover",
    number: 2,
    title: "Chapter 2: A Microrover's First Drive",
    shortTitle: "2 · Sojourner",
    subtitle:
      "Bouncing across Ares Vallis and watching the first rover roll down a ramp",
    heroSiteIds: ["mars-pathfinder"],
    beats: [
      {
        kind: "flySite",
        siteId: "mars-pathfinder",
        sunLon: -55,
        announce: pathfinder.loroIntro,
      },
      {
        kind: "speak",
        line: {
          id: "mars-tour-ch2-sojourner",
          speaker: "loro",
          mood: "excited",
          text: "Sojourner was only as big as a microwave, but her six wheels carried the first rover tracks on another planet. Every rover since—including the ones still driving today—is her descendant.",
          sourceIds: ["S-NSSDCA-1996-068A", "S-NASA-PATHFINDER"],
        },
      },
    ],
  },
  {
    id: "mars-ch3-marathon-twins",
    number: 3,
    title: "Chapter 3: The Twin Marathon Rovers",
    shortTitle: "3 · Twins",
    subtitle:
      "Following Spirit and Opportunity across hot springs and a 45-kilometre marathon",
    heroSiteIds: ["spirit-rover", "opportunity-rover"],
    beats: [
      {
        kind: "flySite",
        siteId: "spirit-rover",
        sunLon: 145,
        sunLat: -12,
        announce: spirit.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "opportunity-rover",
        sunLon: -30,
        announce: opportunity.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch4-ice-and-marsquakes",
    number: 4,
    title: "Chapter 4: Arctic Ice & the Heartbeat of Mars",
    shortTitle: "4 · Quakes",
    subtitle:
      "Uncovering shallow polar ice with Phoenix and feeling 1,319 marsquakes with InSight",
    heroSiteIds: ["phoenix-lander", "insight-lander"],
    beats: [
      {
        kind: "flySite",
        siteId: "phoenix-lander",
        sunLon: -150,
        sunLat: 18,
        announce: phoenix.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "insight-lander",
        sunLon: 108,
        announce: insight.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch5-flying-on-another-world",
    number: 5,
    title: "Chapter 5: Flying on Another World",
    shortTitle: "5 · Flight",
    subtitle:
      "How a 1.8-kilogram helicopter turned a five-flight test into 72 flights over Jezero",
    heroSiteIds: ["ingenuity-helicopter"],
    beats: [
      {
        kind: "flySite",
        siteId: "ingenuity-helicopter",
        sunLon: 52,
        announce: ingenuity.loroIntro,
      },
      {
        kind: "speak",
        line: {
          id: "mars-tour-ch5-outro",
          speaker: "loro",
          mood: "waving",
          text: "Ingenuity was meant to fly five times. She flew seventy-two, and she is still standing in the sand—a tiny monument to the idea that another world's sky is not a limit.",
          sourceIds: ["S-NSSDCA-2020-052B", "S-NASA-INGENUITY"],
        },
      },
    ],
  },
];
