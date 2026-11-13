import type { HeroSite } from "./schema";

/**
 * Moon hero sites — built strictly from the 2026 challenge Resources tab:
 * Apollo Lunar Module descent stages, Lunar Roving Vehicles, ALSEP packages
 * and Surveyor landers. Every fact cites NSSDCA or NASA Science.
 */
export const HERO_SITES: HeroSite[] = [
  {
    id: "surveyor-1",
    tier: "hero",
    name: "Surveyor 1: The First Soft Landing",
    subtitle: "The little lander that proved the Moon's dust could hold a spacecraft",
    mission: "Surveyor 1",
    nssdcaId: "1966-045A",
    year: 1966,
    lat: -2.4745,
    lon: -43.3398,
    region: "Oceanus Procellarum (Ocean of Storms)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "On 2 June 1966, Surveyor 1 settled onto the Ocean of Storms at walking pace—the first American spacecraft to make a controlled soft landing on the Moon. Its three crushable legs and 292-kilogram body proved the regolith could support an Apollo lander.",
    hardwareLeftBehind: [
      "Surveyor 1 lander body and three crushable aluminum-honeycomb legs",
      "Solar panel, battery and planar-array antenna",
      "TV camera, whose vidicon eye returned 11,237 images",
    ],
    stats: [
      {
        label: "Landed Mass",
        value: "292 kg",
        sourceIds: ["S-NSSDCA-1966-045A"],
      },
      {
        label: "Touchdown Speed",
        value: "About 11 km/h",
        sourceIds: ["S-NSSDCA-1966-045A"],
      },
      {
        label: "Images Returned",
        value: "11,237 pictures",
        sourceIds: ["S-NSSDCA-1966-045A"],
      },
      {
        label: "Last Contact",
        value: "7 January 1967",
        sourceIds: ["S-NSSDCA-1966-045A"],
      },
    ],
    loroIntro: {
      id: "surveyor1-loro-intro",
      speaker: "loro",
      mood: "waving",
      text: "Welcome to the Ocean of Storms! This tough little tripod was the first spacecraft to land softly on the Moon and send back pictures—proof that astronauts would not sink into the dust.",
      sourceIds: ["S-NSSDCA-1966-045A", "S-NASA-SURVEYOR"],
    },
    memoryLog: {
      id: "surveyor1-memory-log",
      speaker: "equipment",
      speakerLabel: "SURVEYOR 1 · OCEANUS PROCELLARUM (1966–1967)",
      mood: "nostalgic",
      text: "I touched down at walking speed, bounced once, and settled. For six months I photographed craters and watched the Sun crawl across my solar panel—then lunar night fell and my battery finally slept.",
      sourceIds: ["S-NSSDCA-1966-045A"],
    },
    scienceImpact:
      "Surveyor 1 showed the lunar surface could bear the weight of a lander and returned close-up images of the regolith, clearing the way for Apollo.",
    artemisLink:
      "Modern CLPS landers still borrow Surveyor's crushable-leg and soft-landing playbook when they deliver cargo to the Artemis-era Moon.",
    archivePlate: {
      image: "/images/sites/surveyor-1/then.webp",
      caption:
        "Surveyor 1's own camera looking down at Footpad 2 resting cleanly on firm lunar dust (1966).",
      year: 1966,
    },
    thumbnailImage: "/images/sites/surveyor-1/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1966-045A",
      "S-NASA-SURVEYOR",
      "S-WAGNER-2017",
      "S-LROC-FEATURED",
    ],
  },
  {
    id: "apollo-11",
    tier: "hero",
    name: "Tranquility Base: Eagle's Descent Stage",
    subtitle: "The gold-wrapped launch pad that lifted two humans home",
    mission: "Apollo 11",
    nssdcaId: "1969-059C",
    year: 1969,
    lat: 0.6742,
    lon: 23.4731,
    region: "Mare Tranquillitatis (Sea of Tranquility)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Eagle's descent stage did its job on 20 July 1969: it cushioned Neil Armstrong and Buzz Aldrin onto the Sea of Tranquility, then became the launch pad for their ride home. Its gold foil, four legs and ladder still sit beside the first footprints.",
    hardwareLeftBehind: [
      "Eagle Lunar Module Descent Stage and steel commemorative plaque",
      "Early Apollo Scientific Experiments Package and 100-prism Laser Ranging Retroreflector",
      "TV camera, sample tools, discarded backpacks and boots",
    ],
    stats: [
      {
        label: "Descent Stage Dry Mass",
        value: "About 2,000 kg",
        sourceIds: ["S-NSSDCA-1969-059C"],
      },
      {
        label: "First Footprint",
        value: "20 July 1969",
        sourceIds: ["S-NSSDCA-1969-059C"],
      },
      {
        label: "Laser Return",
        value: "Still bouncing photons from Earth",
        sourceIds: ["S-LLR-SCIENCE"],
      },
      {
        label: "Moon Drift",
        value: "3.8 cm farther each year",
        sourceIds: ["S-LLR-SCIENCE"],
      },
    ],
    loroIntro: {
      id: "ap11-loro-intro",
      speaker: "loro",
      mood: "excited",
      text: "Tranquility Base! Look for the long, dark trail of bootprints east of Eagle—and that little mirror panel still answering green lasers from Earth after more than fifty years.",
      sourceIds: ["S-LROC-FEATURED", "S-LLR-SCIENCE"],
    },
    memoryLog: {
      id: "ap11-memory-log",
      speaker: "equipment",
      speakerLabel: "EAGLE DESCENT STAGE · TRANQUILITY BASE (JULY 1969)",
      mood: "nostalgic",
      text: "I carried the engine, fuel and legs that let Neil and Buzz touch down gently. When they climbed back into the ascent stage, I became the launch pad. I have been watching their footprints from below ever since.",
      sourceIds: ["S-NSSDCA-1969-059C"],
    },
    scienceImpact:
      "The retroreflector left at Tranquility Base remains part of the global Lunar Laser Ranging network, measuring the Moon's distance, libration and slow drift away from Earth.",
    artemisLink:
      "Artemis landing crews will leave new retroreflectors and instruments behind, extending the same fifty-year laser experiment to the lunar South Pole.",
    archivePlate: {
      image: "/images/sites/apollo-11/then.webp",
      caption:
        "Buzz Aldrin setting up the Tranquility Base experiments in front of Eagle (AS11-40-5948, July 1969).",
      year: 1969,
    },
    thumbnailImage: "/images/sites/apollo-11/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1969-059C",
      "S-LLR-SCIENCE",
      "S-WAGNER-2017",
      "S-LROC-FEATURED",
      "S-3D-LM",
    ],
  },
  {
    id: "apollo-12",
    tier: "hero",
    name: "Intrepid: Pinpoint Landing at Surveyor 3",
    subtitle: "The descent stage that parked within walking distance of an old robot",
    mission: "Apollo 12",
    nssdcaId: "1969-099C",
    year: 1969,
    lat: -3.0162,
    lon: -23.418,
    region: "Oceanus Procellarum (Surveyor Crater)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Apollo 12's Intrepid set Pete Conrad and Alan Bean down just 163 metres from Surveyor 3, which had waited on a crater slope for 31 months. Their pinpoint landing turned a navigation gamble into a visit with an old friend.",
    hardwareLeftBehind: [
      "Intrepid Lunar Module Descent Stage",
      "Surveyor 3 lander, minus the camera and scoop returned to Earth",
      "First nuclear-powered ALSEP station and its SNAP-27 generator",
    ],
    stats: [
      {
        label: "Landing Accuracy",
        value: "163 m from Surveyor 3",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
      {
        label: "Surveyor Wait",
        value: "31 months (942 days)",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
      {
        label: "ALSEP Power",
        value: "73 W SNAP-27 RTG",
        sourceIds: ["S-NSSDCA-1969-099C"],
      },
      {
        label: "Station Lifetime",
        value: "Almost 8 years",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
    ],
    loroIntro: {
      id: "ap12-loro-intro",
      speaker: "loro",
      mood: "nostalgic",
      text: "This is my home crater! Pete and Alan landed so close to Surveyor 3 that they walked over and shook hands with a robot that had been alone for two and a half years.",
      sourceIds: ["S-LROC-FEATURED", "S-NSSDCA-1967-035A"],
    },
    memoryLog: {
      id: "ap12-memory-log",
      speaker: "equipment",
      speakerLabel: "INTREPID DESCENT STAGE · SURVEYOR CRATER (NOV 1969)",
      mood: "nostalgic",
      text: "I set my crew down on a crater rim in a rolling ocean of dust. Behind me, Surveyor 3 sat sun-tanned and silent. Pete and Alan carried pieces of it home so engineers could learn what space does to a machine.",
      sourceIds: ["S-NSSDCA-1969-099C", "S-NSSDCA-1967-035A"],
    },
    scienceImpact:
      "Inspecting Surveyor 3 after 31 months on the Moon revealed how micrometeorites, solar radiation and rocket exhaust age hardware—lessons used in spacecraft design ever since.",
    artemisLink:
      "Apollo 12's precision landing proved crews could target a specific spot; Artemis navigation aims for the same accuracy among polar craters.",
    archivePlate: {
      image: "/images/sites/apollo-12-surveyor-3/then.webp",
      caption:
        "Pete Conrad examining Surveyor 3 with Intrepid perched on the crater rim behind him (AS12-48-7136).",
      year: 1969,
    },
    thumbnailImage: "/images/sites/apollo-12-surveyor-3/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1969-099C",
      "S-NSSDCA-1967-035A",
      "S-NASA-SURVEYOR",
      "S-ALSEP-ARCHIVE",
      "S-3D-LM",
    ],
  },
  {
    id: "apollo-14",
    tier: "hero",
    name: "Antares: Landing at Fra Mauro",
    subtitle: "The descent stage that put a science station on the Moon",
    mission: "Apollo 14",
    nssdcaId: "1971-008C",
    year: 1971,
    lat: -3.6442,
    lon: -17.4777,
    region: "Fra Mauro Highlands",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Antares landed in the Fra Mauro highlands on 5 February 1971, the first mission sent to study terrain shaped by the giant Imbrium impact. Alan Shepard and Edgar Mitchell hauled their ALSEP science station out on a handcart and left Antares behind as its anchor.",
    hardwareLeftBehind: [
      "Antares Lunar Module Descent Stage",
      "Apollo 14 ALSEP central station and SNAP-27 generator",
      "Modular Equipment Transport cart and 100-prism retroreflector",
    ],
    stats: [
      {
        label: "Landing Date",
        value: "5 February 1971",
        sourceIds: ["S-NSSDCA-1971-008C"],
      },
      {
        label: "Landing Site",
        value: "Fra Mauro highlands",
        sourceIds: ["S-NSSDCA-1971-008C"],
      },
      {
        label: "ALSEP Instruments",
        value: "Seismometer, magnetometer and more",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Retroreflector",
        value: "Still used for laser ranging",
        sourceIds: ["S-LLR-SCIENCE"],
      },
    ],
    loroIntro: {
      id: "ap14-loro-intro",
      speaker: "loro",
      mood: "narrating",
      text: "Fra Mauro is a highland of jumbled ejecta from the Imbrium impact. Antares settled here so Alan and Edgar could deploy a science station that listened to the Moon for years.",
      sourceIds: ["S-LROC-FEATURED", "S-ALSEP-ARCHIVE"],
    },
    memoryLog: {
      id: "ap14-memory-log",
      speaker: "equipment",
      speakerLabel: "ANTARES DESCENT STAGE · FRA MAURO (FEB 1971)",
      mood: "nostalgic",
      text: "I held the crew steady while they unloaded a cargo of seismometers, a magnetometer and a handcart. When Antares's ascent stage lifted away, I stayed with the instruments and watched them listen to moonquakes.",
      sourceIds: ["S-NSSDCA-1971-008C"],
    },
    scienceImpact:
      "Apollo 14's ALSEP measured moonquakes and the deep structure of the lunar crust, and its retroreflector joined the laser-ranging network.",
    artemisLink:
      "Fra Mauro's seismic data still helps engineers model how the lunar surface responds to impacts—useful for siting Artemis habitats.",
    archivePlate: {
      image: "/images/sites/apollo-14-alsep/then.webp",
      caption:
        "Apollo 14's ALSEP instruments arrayed across the Fra Mauro highlands with Antares in the distance (AS14-67-9367).",
      year: 1971,
    },
    thumbnailImage: "/images/sites/apollo-14-alsep/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1971-008C",
      "S-ALSEP-ARCHIVE",
      "S-LLR-SCIENCE",
      "S-WAGNER-2017",
      "S-3D-LM",
    ],
  },
  {
    id: "apollo-15",
    tier: "hero",
    name: "Falcon: Hadley Rille Landing",
    subtitle: "The descent stage at the foot of a four-kilometre mountain",
    mission: "Apollo 15",
    nssdcaId: "1971-063C",
    year: 1971,
    lat: 26.1324,
    lon: 3.6333,
    region: "Hadley-Apennine (base of Mons Hadley)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Falcon touched down beside Hadley Rille on 30 July 1971, opening the era of the lunar road trip. Its descent stage carried LRV-1 folded against its side and left the first Moon car parked at the foot of a four-kilometre mountain.",
    hardwareLeftBehind: [
      "Falcon Lunar Module Descent Stage",
      "Lunar Roving Vehicle #1, parked east of Falcon",
      "Apollo 15 ALSEP station and the Fallen Astronaut memorial",
    ],
    stats: [
      {
        label: "Landing Date",
        value: "30 July 1971",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "Rover Delivered",
        value: "LRV-1",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "Hadley Rille Depth",
        value: "Up to about 300 m",
        sourceIds: ["S-WAGNER-2017"],
      },
      {
        label: "Mons Hadley Height",
        value: "About 4.5 km",
        sourceIds: ["S-WAGNER-2017"],
      },
    ],
    loroIntro: {
      id: "ap15-loro-intro",
      speaker: "loro",
      mood: "excited",
      text: "Look at those mountain shadows! Falcon sits between the Apennines and winding Hadley Rille, with the first Moon buggy parked nearby.",
      sourceIds: ["S-LROC-FEATURED", "S-WAGNER-2017"],
    },
    memoryLog: {
      id: "ap15-memory-log",
      speaker: "equipment",
      speakerLabel: "FALCON DESCENT STAGE · HADLEY (JULY 1971)",
      mood: "nostalgic",
      text: "I carried a folded car on my side. Once Dave and Jim deployed it, they drove farther than any astronauts had walked. I stayed at the landing site, keeping their experiments level and their memories anchored.",
      sourceIds: ["S-NSSDCA-1971-063C"],
    },
    scienceImpact:
      "Apollo 15's samples included the Genesis Rock, an ancient anorthosite that helped prove the early Moon had a global magma ocean.",
    artemisLink:
      "Falcon's payload—a rover and a science station—is the template for Artemis surface missions that will combine mobility with long-lived instruments.",
    archivePlate: {
      image: "/images/sites/apollo-15-lrv/then.webp",
      caption:
        "Jim Irwin beside LRV-1 with Mount Hadley rising behind him (AS15-86-11603, August 1971).",
      year: 1971,
    },
    thumbnailImage: "/images/sites/apollo-15-lrv/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1971-063C",
      "S-ALSEP-ARCHIVE",
      "S-WAGNER-2017",
      "S-3D-LM",
      "S-3D-LRV",
    ],
  },
  {
    id: "apollo-16",
    tier: "hero",
    name: "Orion: Descartes Highlands Landing",
    subtitle: "The descent stage that shaded a telescope at lunar noon",
    mission: "Apollo 16",
    nssdcaId: "1972-031C",
    year: 1972,
    lat: -8.9734,
    lon: 15.5011,
    region: "Descartes Highlands",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Orion landed in the bright Descartes highlands on 21 April 1972. Its shadow became an observatory: John Young and Charlie Duke set a gold-plated ultraviolet camera beneath it, then left Orion to keep the site company with LRV-2 and an ALSEP station.",
    hardwareLeftBehind: [
      "Orion Lunar Module Descent Stage",
      "Far-Ultraviolet Camera/Spectrograph tripod",
      "Lunar Roving Vehicle #2 and the Descartes ALSEP",
    ],
    stats: [
      {
        label: "Landing Date",
        value: "21 April 1972",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "UV Exposures",
        value: "178 deep-space photos",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "Rover",
        value: "LRV-2",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "Sample Highlight",
        value: "Big Muley, 11.7 kg",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
    ],
    loroIntro: {
      id: "ap16-loro-intro",
      speaker: "loro",
      mood: "narrating",
      text: "Up in the bright highlands sits humanity's first telescope on another world. John and Charlie tucked it into Orion's shadow so the blinding lunar Sun would not wash out the ultraviolet sky.",
      sourceIds: ["S-LROC-FEATURED", "S-NSSDCA-1972-031C"],
    },
    memoryLog: {
      id: "ap16-memory-log",
      speaker: "equipment",
      speakerLabel: "ORION DESCENT STAGE · DESCARTES (APR 1972)",
      mood: "nostalgic",
      text: "My shadow was dark and cold—perfect for a camera that needed to see faint ultraviolet light. For three days I shaded it while it photographed Earth's hydrogen halo and distant galaxies.",
      sourceIds: ["S-NSSDCA-1972-031C"],
    },
    scienceImpact:
      "The Far-Ultraviolet Camera returned the first ultraviolet images from the Moon and surveyed Earth's geocorona and the Magellanic Clouds.",
    artemisLink:
      "The lesson that lunar shadows can host sensitive instruments is being applied to future farside radio and ultraviolet observatories.",
    archivePlate: {
      image: "/images/sites/apollo-16-descartes/then.webp",
      caption:
        "Orion Descent Stage with the gold-plated Far-UV Telescope resting in its shadow (AS16-114-18423).",
      year: 1972,
    },
    thumbnailImage: "/images/sites/apollo-16-descartes/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1972-031C",
      "S-ALSEP-ARCHIVE",
      "S-WAGNER-2017",
      "S-3D-LM",
      "S-3D-LRV",
    ],
  },
  {
    id: "apollo-17",
    tier: "hero",
    name: "Challenger: Taurus-Littrow Landing",
    subtitle: "The last descent stage left by humans on the Moon",
    mission: "Apollo 17",
    nssdcaId: "1972-096C",
    year: 1972,
    lat: 20.1911,
    lon: 30.7723,
    region: "Taurus-Littrow Valley",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Challenger settled into the Taurus-Littrow valley on 11 December 1972, beginning the final Apollo landing. Gene Cernan and Harrison Schmitt explored by rover, collected orange volcanic soil, and left Challenger as the last human-built launch pad on the Moon.",
    hardwareLeftBehind: [
      "Challenger Lunar Module Descent Stage",
      "Lunar Roving Vehicle #3, parked east of Challenger",
      "Apollo 17 ALSEP with heat-flow probes and a surface gravimeter",
    ],
    stats: [
      {
        label: "Landing Date",
        value: "11 December 1972",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Rover Distance",
        value: "35.9 km (Apollo record)",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Samples Returned",
        value: "110.5 kg",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Last Liftoff",
        value: "14 December 1972",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
    ],
    loroIntro: {
      id: "ap17-loro-intro",
      speaker: "loro",
      mood: "nostalgic",
      text: "This is where humans last stood on the Moon. Challenger rests in a valley cut through ancient highlands, surrounded by the tracks of the final rover expedition.",
      sourceIds: ["S-LROC-FEATURED", "S-WAGNER-2017"],
    },
    memoryLog: {
      id: "ap17-memory-log",
      speaker: "equipment",
      speakerLabel: "CHALLENGER DESCENT STAGE · TAURUS-LITTROW (DEC 1972)",
      mood: "nostalgic",
      text: "I was the last spacecraft to set humans down on the Moon. Gene and Jack drove far up the valley, found orange glass from ancient fire fountains, and came back with rocks. Then their ascent stage rose out of me and the silence returned.",
      sourceIds: ["S-NSSDCA-1972-096C"],
    },
    scienceImpact:
      "Apollo 17 returned orange volcanic glass that later revealed traces of water trapped inside the lunar interior, and its ALSEP measured the Moon's heat flow.",
    artemisLink:
      "Challenger's site is a benchmark for preserving lunar heritage as Artemis and commercial missions return to the Moon.",
    archivePlate: {
      image: "/images/sites/apollo-17-lrv/then.webp",
      caption:
        "Gene Cernan parking LRV-3 at its final Taurus-Littrow vantage point before liftoff (AS17-143-21932).",
      year: 1972,
    },
    thumbnailImage: "/images/sites/apollo-17-lrv/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1972-096C",
      "S-ALSEP-ARCHIVE",
      "S-WAGNER-2017",
      "S-3D-LM",
      "S-3D-LRV",
    ],
  },
  {
    id: "surveyor-7",
    tier: "hero",
    name: "Surveyor 7: Sentinel at Tycho",
    subtitle: "The last Surveyor landed on the rugged rim of a young crater",
    mission: "Surveyor 7",
    nssdcaId: "1968-001A",
    year: 1968,
    lat: -40.9812,
    lon: -11.5127,
    region: "North rim of Tycho Crater",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Surveyor 7 touched down on the ejecta blanket north of Tycho on 10 January 1968, the final and most ambitious Surveyor. It carried a robotic claw and chemistry box, survived a frigid lunar night, and even caught laser beams fired at it from Earth.",
    hardwareLeftBehind: [
      "Surveyor 7 lander with robotic surface-sampler claw",
      "Alpha-scattering chemistry instrument",
      "Solar panel, battery and TV camera",
    ],
    stats: [
      {
        label: "Landed Mass",
        value: "305.7 kg",
        sourceIds: ["S-NSSDCA-1968-001A"],
      },
      {
        label: "Landing Site",
        value: "Tycho north rim",
        sourceIds: ["S-NSSDCA-1968-001A"],
      },
      {
        label: "Images Returned",
        value: "21,274",
        sourceIds: ["S-NSSDCA-1968-001A"],
      },
      {
        label: "Laser Sighting",
        value: "Detected from two Earth observatories",
        sourceIds: ["S-NSSDCA-1968-001A"],
      },
    ],
    loroIntro: {
      id: "surveyor7-loro-intro",
      speaker: "loro",
      mood: "scanning",
      text: "Tycho is one of the youngest, brightest craters on the Moon. Surveyor 7 landed on its rough ejecta blanket and used a little claw to test the soil.",
      sourceIds: ["S-NSSDCA-1968-001A", "S-LROC-FEATURED"],
    },
    memoryLog: {
      id: "surveyor7-memory-log",
      speaker: "equipment",
      speakerLabel: "SURVEYOR 7 · TYCHO RIM (JAN 1968)",
      mood: "nostalgic",
      text: "My site was chosen because it was hard—rough, bright ejecta that no lander had touched. I used my claw to dig and my chemistry box to taste the soil, then watched Earth's lasers blink at me across 380,000 kilometres.",
      sourceIds: ["S-NSSDCA-1968-001A"],
    },
    scienceImpact:
      "Surveyor 7's chemistry and images showed the Tycho ejecta was different from the maria, adding a highland sample to the Surveyor story.",
    artemisLink:
      "Surveyor 7's rugged-site landing is a direct ancestor of Artemis-era landers aiming for difficult polar terrain.",
    archivePlate: {
      image: "/images/sites/surveyor-7/then.webp",
      caption:
        "Surveyor 7's view across the boulder-strewn ejecta north of Tycho Crater (1968).",
      year: 1968,
    },
    thumbnailImage: "/images/sites/surveyor-7/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1968-001A",
      "S-NASA-SURVEYOR",
      "S-WAGNER-2017",
      "S-LROC-FEATURED",
    ],
  },
];
