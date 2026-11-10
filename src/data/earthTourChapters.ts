import { EARTH_HERO_SITES } from "./earthHeroSites";
import type { TourChapter } from "./schema";

function earthHeroById(id: string) {
  const site = EARTH_HERO_SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Missing Earth hero site: ${id}`);
  return site;
}

const kennedy = earthHeroById("kennedy-lc39");
const baikonur = earthHeroById("baikonur-gagarin");
const canaveral = earthHeroById("cape-canaveral-slc");
const houston = earthHeroById("houston-jsc-mcc");
const jpl = earthHeroById("jpl-pasadena");
const kourou = earthHeroById("kourou-csg");
const vandenberg = earthHeroById("vandenberg-sfb");
const sriharikota = earthHeroById("sriharikota-sdsc");
const goldstone = earthHeroById("goldstone-dsn");

export const EARTH_TOUR_CHAPTERS: TourChapter[] = [
  {
    id: "earth-ch1-space-age-cradles",
    number: 1,
    title: "Chapter 1: Cradles of the Space Age",
    shortTitle: "1 · Launch Row",
    subtitle: "From Gagarin's steppe launchpad at Baikonur to my own Atlas-Centaur pad at Cape Canaveral",
    heroSiteIds: ["baikonur-gagarin", "cape-canaveral-slc"],
    beats: [
      {
        kind: "flySite",
        siteId: "baikonur-gagarin",
        sunLon: 65,
        announce: baikonur.loroIntro,
      },
      {
        kind: "speak",
        siteId: "baikonur-gagarin",
        line: baikonur.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "cape-canaveral-slc",
        sunLon: -75,
        announce: canaveral.loroIntro,
      },
      {
        kind: "speak",
        siteId: "cape-canaveral-slc",
        line: canaveral.memoryLog,
      },
    ],
  },
  {
    id: "earth-ch2-moonport-lc39",
    number: 2,
    title: "Chapter 2: Humanity's Moonport (LC-39A & 39B)",
    shortTitle: "2 · Moonport",
    subtitle: "Where Saturn V, Space Shuttle, Crew Dragon, and Artemis thundered off Florida's coast",
    heroSiteIds: ["kennedy-lc39"],
    beats: [
      {
        kind: "flySite",
        siteId: "kennedy-lc39",
        sunLon: -78,
        announce: kennedy.loroIntro,
      },
      {
        kind: "speak",
        siteId: "kennedy-lc39",
        line: kennedy.memoryLog,
      },
      {
        kind: "speak",
        siteId: "kennedy-lc39",
        line: {
          id: "earth-tour-ch2-vab",
          speaker: "loro",
          mood: "excited",
          text: "Every Apollo Lunar Module and Laser Retroreflector began its journey tucked inside a 111-meter Saturn V right here at Pad 39A—and today Pad 39B launches NASA's Artemis Moon rockets!",
          sourceIds: ["S-NASA-KSC", "S-NSSDCA-1969-059C"],
        },
      },
    ],
  },
  {
    id: "earth-ch3-mission-control",
    number: 3,
    title: "Chapter 3: 'Houston' & The Center of the Universe",
    shortTitle: "3 · Control",
    subtitle: "Inside the two nerve centers that guide every astronaut and robotic explorer across space",
    heroSiteIds: ["houston-jsc-mcc", "jpl-pasadena"],
    beats: [
      {
        kind: "flySite",
        siteId: "houston-jsc-mcc",
        sunLon: -92,
        announce: houston.loroIntro,
      },
      {
        kind: "speak",
        siteId: "houston-jsc-mcc",
        line: houston.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "jpl-pasadena",
        sunLon: -115,
        announce: jpl.loroIntro,
      },
      {
        kind: "speak",
        siteId: "jpl-pasadena",
        line: jpl.memoryLog,
      },
    ],
  },
  {
    id: "earth-ch4-deep-space-network",
    number: 4,
    title: "Chapter 4: Giant Ears in the Desert",
    shortTitle: "4 · Deep Space",
    subtitle: "How 70-meter dishes in Goldstone, Madrid, and Canberra never lose sight of the Moon",
    heroSiteIds: ["goldstone-dsn"],
    beats: [
      {
        kind: "flySite",
        siteId: "goldstone-dsn",
        sunLon: -114,
        announce: goldstone.loroIntro,
      },
      {
        kind: "speak",
        siteId: "goldstone-dsn",
        line: goldstone.memoryLog,
      },
    ],
  },
  {
    id: "earth-ch5-global-spaceports",
    number: 5,
    title: "Chapter 5: Global Spaceports to the Poles & Stars",
    shortTitle: "5 · Global",
    subtitle: "From California's polar cliffs and Kourou's equator to India's Lunar South Pole triumph",
    heroSiteIds: ["vandenberg-sfb", "kourou-csg", "sriharikota-sdsc"],
    beats: [
      {
        kind: "flySite",
        siteId: "vandenberg-sfb",
        sunLon: -118,
        announce: vandenberg.loroIntro,
      },
      {
        kind: "speak",
        siteId: "vandenberg-sfb",
        line: vandenberg.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "kourou-csg",
        sunLon: -50,
        announce: kourou.loroIntro,
      },
      {
        kind: "speak",
        siteId: "kourou-csg",
        line: kourou.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "sriharikota-sdsc",
        sunLon: 82,
        announce: sriharikota.loroIntro,
      },
      {
        kind: "speak",
        siteId: "sriharikota-sdsc",
        line: sriharikota.memoryLog,
      },
      {
        kind: "speak",
        siteId: "sriharikota-sdsc",
        line: {
          id: "earth-tour-ch5-finale",
          speaker: "loro",
          mood: "waving",
          text: "Every single pioneer on the Moon started its journey at one of these coastal pads, desert dishes, or control rooms! Spin the Blue Marble to explore all 24 Earth spaceports—or hop back to the Moon anytime!",
          sourceIds: ["S-BLUE-MARBLE", "S-ISRO-SDSC", "S-NASA-KSC"],
        },
      },
    ],
  },
];
