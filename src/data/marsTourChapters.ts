import { MARS_HERO_SITES } from "./marsHeroSites";
import type { TourChapter } from "./schema";

function marsHeroById(id: string) {
  const site = MARS_HERO_SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Missing Mars hero site: ${id}`);
  return site;
}

const viking1 = marsHeroById("viking-1");
const pathfinder = marsHeroById("mars-pathfinder");
const spirit = marsHeroById("spirit-rover");
const opportunity = marsHeroById("opportunity-rover");
const phoenix = marsHeroById("phoenix-lander");
const curiosity = marsHeroById("curiosity-rover");
const insight = marsHeroById("insight-lander");
const perseverance = marsHeroById("perseverance-rover");
const ingenuity = marsHeroById("ingenuity-helicopter");

export const MARS_TOUR_CHAPTERS: TourChapter[] = [
  {
    id: "mars-ch1-first-footprints",
    number: 1,
    title: "Chapter 1: First Touchdowns & Airbag Bounces",
    shortTitle: "1 · Pioneers",
    subtitle: "How Viking 1 and bouncing Mars Pathfinder opened the rusty plains of the Red Planet",
    heroSiteIds: ["viking-1", "mars-pathfinder"],
    beats: [
      {
        kind: "flySite",
        siteId: "viking-1",
        sunLon: -75,
        announce: viking1.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "mars-pathfinder",
        sunLon: -60,
        announce: pathfinder.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch2-marathon-twins",
    number: 2,
    title: "Chapter 2: The 90-Sol Twins That Refused to Quit",
    shortTitle: "2 · Twins",
    subtitle: "Following Spirit and Opportunity across ancient hot springs and a 45-kilometer marathon",
    heroSiteIds: ["spirit-rover", "opportunity-rover"],
    beats: [
      {
        kind: "flySite",
        siteId: "spirit-rover",
        sunLon: 145,
        announce: spirit.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "opportunity-rover",
        sunLon: -35,
        announce: opportunity.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch3-ice-and-marsquakes",
    number: 3,
    title: "Chapter 3: Arctic Ice & The Heartbeat of Mars",
    shortTitle: "3 · Quakes",
    subtitle: "Uncovering shallow polar water ice with Phoenix and feeling 1,319 marsquakes with InSight",
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
    id: "mars-ch4-curiosity-and-ingenuity",
    number: 4,
    title: "Chapter 4: Sky Cranes & First Flight at Jezero",
    shortTitle: "4 · Flight",
    subtitle: "Climbing Mount Sharp with Curiosity and spinning Ingenuity's rotors at 2,537 RPM",
    heroSiteIds: ["curiosity-rover", "ingenuity-helicopter"],
    beats: [
      {
        kind: "flySite",
        siteId: "curiosity-rover",
        sunLon: 110,
        announce: curiosity.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "ingenuity-helicopter",
        sunLon: 52,
        announce: ingenuity.loroIntro,
      },
    ],
  },
  {
    id: "mars-ch5-oxygen-for-humans",
    number: 5,
    title: "Chapter 5: Making Oxygen & Caching Tubes for Humans",
    shortTitle: "5 · Future",
    subtitle: "How Perseverance's MOXIE box and Three Forks Sample Depot prepare for the first astronauts on Mars",
    heroSiteIds: ["perseverance-rover"],
    beats: [
      {
        kind: "flySite",
        siteId: "perseverance-rover",
        sunLon: 52,
        announce: perseverance.loroIntro,
      },
    ],
  },
];
