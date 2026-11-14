import { HERO_SITES } from "./heroSites";
import type { TourChapter } from "./schema";

function heroById(id: string) {
  const site = HERO_SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Missing hero site: ${id}`);
  return site;
}

const surveyor1 = heroById("surveyor-1");
const surveyor7 = heroById("surveyor-7");
const apollo11 = heroById("apollo-11");
const apollo12 = heroById("apollo-12");
const apollo14 = heroById("apollo-14");
const apollo15 = heroById("apollo-15");
const apollo16 = heroById("apollo-16");
const apollo17 = heroById("apollo-17");

export const TOUR_CHAPTERS: TourChapter[] = [
  {
    id: "chapter-1-robot-scouts",
    number: 1,
    title: "Chapter 1: The Fearless Robot Scouts",
    shortTitle: "1966–68",
    subtitle:
      "How Surveyor landers proved the Moon's dust could hold a spacecraft",
    heroSiteIds: ["surveyor-1", "surveyor-7"],
    beats: [
      {
        kind: "flySite",
        siteId: "surveyor-1",
        sunLon: -62,
        announce: surveyor1.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "surveyor-7",
        sunLon: -30,
        sunLat: -20,
        announce: surveyor7.loroIntro,
      },
    ],
  },
  {
    id: "chapter-2-tranquility-base",
    number: 2,
    title: "Chapter 2: Eagle's Base & First Footprints",
    shortTitle: "1969",
    subtitle:
      "What stayed behind in the Sea of Tranquility so Neil and Buzz could fly home",
    heroSiteIds: ["apollo-11"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-11",
        sunLon: -18,
        announce: apollo11.loroIntro,
      },
    ],
  },
  {
    id: "chapter-3-old-friends-and-moonquakes",
    number: 3,
    title: "Chapter 3: Old Friends & Ringing Moonquakes",
    shortTitle: "1969–71",
    subtitle:
      "Visiting a sun-tanned robot neighbour and switching on the Moon's first science stations",
    heroSiteIds: ["apollo-12", "apollo-14"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-12",
        sunLon: -48,
        announce: apollo12.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "apollo-14",
        sunLon: -40,
        announce: apollo14.loroIntro,
      },
    ],
  },
  {
    id: "chapter-4-parked-moon-buggies",
    number: 4,
    title: "Chapter 4: Parked Moon Buggies & Highland Labs",
    shortTitle: "1971–72",
    subtitle:
      "Wire-mesh wheels, a telescope in a lander's shadow, and the last rover tracks",
    heroSiteIds: ["apollo-15", "apollo-16", "apollo-17"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-15",
        sunLon: -32,
        announce: apollo15.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "apollo-16",
        sunLon: -20,
        announce: apollo16.loroIntro,
      },
      {
        kind: "flySite",
        siteId: "apollo-17",
        sunLon: -10,
        announce: apollo17.loroIntro,
      },
    ],
  },
  {
    id: "chapter-5-still-answering-earth",
    number: 5,
    title: "Chapter 5: Still Answering Earth",
    shortTitle: "NOW",
    subtitle:
      "From fifty-year-old laser mirrors to the new instruments Artemis crews will leave behind",
    heroSiteIds: ["apollo-11", "apollo-14", "apollo-15"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-11",
        sunLon: -18,
        reprise: true,
        announce: {
          id: "tour-moon-ch5-announce",
          speaker: "loro",
          speakerLabel: "SURVEYOR 3 · LEGACY STOP",
          mood: "excited",
          text: "Three Apollo crews left mirrors here. Every week, Earth fires lasers at them, and each returning photon measures the Moon drifting away.",
          sourceIds: ["S-LLR-SCIENCE", "S-NSSDCA-1969-059C"],
        },
      },
      {
        kind: "flySite",
        siteId: "apollo-14",
        sunLon: -40,
        reprise: true,
        announce: {
          id: "tour-moon-ch5-apollo14",
          speaker: "loro",
          speakerLabel: "SURVEYOR 3 · LEGACY STOP",
          mood: "nostalgic",
          text: "Fifty years on, Antares's seismometer still quietly listens as the Moon flexes, while its handcart rests in the ancient highlands.",
          sourceIds: ["S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
        },
      },
      {
        kind: "flySite",
        siteId: "apollo-15",
        sunLon: -32,
        reprise: true,
        announce: {
          id: "tour-moon-ch5-apollo15",
          speaker: "loro",
          speakerLabel: "SURVEYOR 3 · LEGACY STOP",
          mood: "nostalgic",
          text: "Falcon's small mirror still catches Earth's lasers, measuring the Moon's slow drift away from home while its rover sleeps nearby.",
          sourceIds: ["S-LLR-SCIENCE", "S-WAGNER-2017"],
        },
      },
      {
        kind: "speak",
        line: {
          id: "tour-moon-ch5-outro",
          speaker: "loro",
          mood: "waving",
          text: "The hardware left behind is not junk—it is a fifty-year experiment, a seismic network, and a set of tracks that mark where humanity first learned to live beyond Earth.",
          sourceIds: ["S-LLR-SCIENCE", "S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
        },
      },
    ],
  },
];
