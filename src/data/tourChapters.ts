import { HERO_SITES } from "./heroSites";
import type { TourChapter } from "./schema";

function heroById(id: string) {
  const site = HERO_SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Missing hero site: ${id}`);
  return site;
}

const ranger7 = heroById("ranger-7");
const surveyor1 = heroById("surveyor-1");
const apollo11 = heroById("apollo-11");
const apollo12 = heroById("apollo-12-surveyor-3");
const apollo14 = heroById("apollo-14-alsep");
const apollo15 = heroById("apollo-15-lrv");
const apollo16 = heroById("apollo-16-descartes");
const apollo17 = heroById("apollo-17-lrv");
const artemis = heroById("artemis-south-pole");

export const TOUR_CHAPTERS: TourChapter[] = [
  {
    id: "chapter-1-robot-scouts",
    number: 1,
    title: "Chapter 1: The Fearless Robot Scouts",
    shortTitle: "1 · Scouts",
    subtitle: "How early cameras and three-legged robots proved the Moon was safe to touch",
    heroSiteIds: ["ranger-7", "surveyor-1"],
    beats: [
      {
        kind: "flySite",
        siteId: "ranger-7",
        sunLon: -55,
        announce: ranger7.loroIntro,
      },
      {
        kind: "speak",
        siteId: "ranger-7",
        line: ranger7.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "surveyor-1",
        sunLon: -68,
        announce: surveyor1.loroIntro,
      },
      {
        kind: "speak",
        siteId: "surveyor-1",
        line: surveyor1.memoryLog,
      },
    ],
  },
  {
    id: "chapter-2-tranquility-base",
    number: 2,
    title: "Chapter 2: Eagle's Base & First Footprints",
    shortTitle: "2 · Eagle",
    subtitle: "What stayed behind in the Sea of Tranquility so Neil and Buzz could fly home",
    heroSiteIds: ["apollo-11"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-11",
        sunLon: -18,
        announce: apollo11.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-11",
        line: {
          id: "tour-ch2-footprints",
          speaker: "loro",
          mood: "scanning",
          text: "With no wind or rain on the Moon, Neil and Buzz's dark bootprint trails look just as fresh from LRO's orbit today as they did in July 1969.",
          sourceIds: ["S-LROC-FEATURED"],
        },
      },
      {
        kind: "speak",
        siteId: "apollo-11",
        line: {
          id: "tour-ch2-eagle-stage",
          speaker: "loro",
          mood: "narrating",
          text: "Every kilogram mattered for liftoff—so Eagle's shiny gold Descent Stage stayed behind as a launchpad in the dust, wearing a plaque that reads: 'We came in peace for all mankind.'",
          sourceIds: ["S-NSSDCA-1969-059C"],
        },
      },
    ],
  },
  {
    id: "chapter-3-neighbors-and-moonquakes",
    number: 3,
    title: "Chapter 3: Old Friends & Ringing Moonquakes",
    shortTitle: "3 · Quakes",
    subtitle: "Visiting a sun-tanned robot neighbor and listening to 12,000 lunar rumbles",
    heroSiteIds: ["apollo-12-surveyor-3", "apollo-14-alsep"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-12-surveyor-3",
        sunLon: -52,
        announce: apollo12.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-12-surveyor-3",
        line: apollo12.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "apollo-14-alsep",
        sunLon: -45,
        announce: apollo14.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-14-alsep",
        line: apollo14.memoryLog,
      },
    ],
  },
  {
    id: "chapter-4-parked-moon-buggies",
    number: 4,
    title: "Chapter 4: Parked Moon Buggies & Highland Labs",
    shortTitle: "4 · Rovers",
    subtitle: "Wire-mesh wheels, a telescope in a lander's shadow, and filming the last liftoff",
    heroSiteIds: ["apollo-15-lrv", "apollo-16-descartes", "apollo-17-lrv"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-15-lrv",
        sunLon: -32,
        announce: apollo15.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-15-lrv",
        line: apollo15.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "apollo-16-descartes",
        sunLon: -20,
        announce: apollo16.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-16-descartes",
        line: apollo16.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "apollo-17-lrv",
        sunLon: -10,
        announce: apollo17.loroIntro,
      },
      {
        kind: "speak",
        siteId: "apollo-17-lrv",
        line: apollo17.memoryLog,
      },
    ],
  },
  {
    id: "chapter-5-still-alive-to-artemis",
    number: 5,
    title: "Chapter 5: Still Answering Earth → Next Stop, Artemis!",
    shortTitle: "5 · Artemis",
    subtitle: "From 57-year-old laser mirrors to the icy craters of the Lunar South Pole",
    heroSiteIds: ["apollo-11", "artemis-south-pole"],
    beats: [
      {
        kind: "flySite",
        siteId: "apollo-11",
        sunLon: -18,
        announce: apollo11.memoryLog,
      },
      {
        kind: "flySite",
        siteId: "artemis-south-pole",
        sunLon: -48,
        sunLat: -1.5,
        announce: artemis.loroIntro,
      },
      {
        kind: "speak",
        siteId: "artemis-south-pole",
        line: artemis.memoryLog,
      },
      {
        kind: "speak",
        siteId: "artemis-south-pole",
        line: {
          id: "tour-ch5-finale",
          speaker: "loro",
          mood: "waving",
          text: "None of these machines were truly forgotten—every single one lit a beacon for NASA's Artemis astronauts! Now the whole Moon is yours: spin the globe and explore all 29 silent pioneers!",
          sourceIds: ["S-NSSDCA-2009-031B", "S-SVS-4720"],
        },
      },
    ],
  },
];
