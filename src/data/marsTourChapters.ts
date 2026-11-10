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
        openTab: "story",
        announce: viking1.loroIntro,
      },
      {
        kind: "speak",
        siteId: "viking-1",
        openTab: "story",
        line: viking1.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "mars-pathfinder",
        sunLon: -60,
        openTab: "story",
        announce: pathfinder.loroIntro,
      },
      {
        kind: "speak",
        siteId: "mars-pathfinder",
        openTab: "then-now",
        line: pathfinder.memoryLog,
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
        openTab: "story",
        announce: spirit.loroIntro,
      },
      {
        kind: "speak",
        siteId: "spirit-rover",
        openTab: "story",
        line: spirit.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "opportunity-rover",
        sunLon: -35,
        openTab: "story",
        announce: opportunity.loroIntro,
      },
      {
        kind: "speak",
        siteId: "opportunity-rover",
        openTab: "then-now",
        line: opportunity.memoryLog,
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
        openTab: "story",
        announce: phoenix.loroIntro,
      },
      {
        kind: "speak",
        siteId: "phoenix-lander",
        openTab: "story",
        line: phoenix.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "insight-lander",
        sunLon: 108,
        openTab: "story",
        announce: insight.loroIntro,
      },
      {
        kind: "speak",
        siteId: "insight-lander",
        openTab: "story",
        line: insight.memoryLog,
      },
      {
        kind: "spotlightWidget",
        siteId: "insight-lander",
        promptLine: {
          id: "mars-tour-ch3-quake-prompt",
          speaker: "loro",
          mood: "excited",
          text: "Try triggering a Marsquake on InSight's SEIS dome! Compare how Martian waves echo between Earth and Moon crust to reveal Mars's giant liquid core! Click 'Continue' when ready.",
          sourceIds: ["S-NSSDCA-2018-042A"],
        },
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
        openTab: "story",
        announce: curiosity.loroIntro,
      },
      {
        kind: "speak",
        siteId: "curiosity-rover",
        openTab: "model",
        line: curiosity.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "ingenuity-helicopter",
        sunLon: 52,
        openTab: "story",
        announce: ingenuity.loroIntro,
      },
      {
        kind: "speak",
        siteId: "ingenuity-helicopter",
        openTab: "story",
        line: ingenuity.memoryLog,
      },
      {
        kind: "spotlightWidget",
        siteId: "ingenuity-helicopter",
        promptLine: {
          id: "mars-tour-ch4-heli-prompt",
          speaker: "loro",
          mood: "excited",
          text: "Mars's air is 99% thinner than Earth's! Spin up Ingenuity's coaxial carbon-fiber blades past 2,400 RPM in the flight lab to lift off above Jezero Crater!",
          sourceIds: ["S-NSSDCA-2020-052B"],
        },
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
        openTab: "story",
        announce: perseverance.loroIntro,
      },
      {
        kind: "speak",
        siteId: "perseverance-rover",
        openTab: "story",
        line: perseverance.memoryLog,
      },
      {
        kind: "spotlightWidget",
        siteId: "perseverance-rover",
        promptLine: {
          id: "mars-tour-ch5-moxie-prompt",
          speaker: "loro",
          mood: "excited",
          text: "Power up MOXIE's solid-oxide fuel cells to 800°C! Split Martian CO₂ into pure breathable oxygen for astronauts and rocket fuel!",
          sourceIds: ["S-NSSDCA-2020-052A"],
        },
      },
      {
        kind: "speak",
        siteId: "perseverance-rover",
        openTab: "then-now",
        line: {
          id: "mars-tour-ch5-finale",
          speaker: "loro",
          mood: "waving",
          text: "From Viking 1's footpads to Opportunity's marathon tracks, Ingenuity's wings, and Perseverance's sample tubes—none of these Martian pioneers are forgotten! Now spin the Red Planet and explore all 27 sites!",
          sourceIds: ["S-NSSDCA-2020-052A", "S-MOLA-MEGDR"],
        },
      },
    ],
  },
];
