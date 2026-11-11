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
        kind: "flySite",
        siteId: "cape-canaveral-slc",
        sunLon: -75,
        announce: canaveral.loroIntro,
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
        kind: "flySite",
        siteId: "jpl-pasadena",
        sunLon: -115,
        announce: jpl.loroIntro,
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
        kind: "flySite",
        siteId: "kourou-csg",
        sunLon: -50,
        announce: kourou.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "sriharikota-sdsc",
        sunLon: 82,
        announce: sriharikota.loroIntro,
      },
    ],
  },
];
