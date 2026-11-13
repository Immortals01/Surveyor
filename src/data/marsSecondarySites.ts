import type { SecondarySite } from "./schema";

/**
 * Mars secondary sites — the microrover and the two airbag lander platforms
 * that carried Spirit and Opportunity onto the surface. Each one is a separate
 * piece of hardware still sitting on Mars today.
 */
export const MARS_SECONDARY_SITES: SecondarySite[] = [
  {
    id: "sojourner-rover",
    tier: "secondary",
    name: "Sojourner: The First Mars Rover",
    subtitle:
      "The 11.5-kilogram microwave-sized pioneer that proved roving works on Mars",
    mission: "Mars Pathfinder",
    nssdcaId: "1996-068A",
    year: 1997,
    lat: 19.13,
    lon: -33.22,
    region: "Ares Vallis",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    parentHeroId: "mars-pathfinder",
    summary:
      "Sojourner rolled down Pathfinder's ramp on 6 July 1997 and became the first wheeled vehicle to explore another planet. Built for seven sols, the little rocker-bogie rover lasted 83, drove about 100 metres around the lander, and used its alpha-proton spectrometer to analyse 16 rocks.",
    hardwareLeftBehind: [
      "11.5 kg six-wheeled Sojourner microrover",
      "Alpha Proton X-ray Spectrometer and forward camera",
      "Twin wheel tracks circling the Pathfinder lander",
    ],
    stats: [
      {
        label: "Rover Mass",
        value: "11.5 kg",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Planned vs Actual",
        value: "7 sols → 83 sols",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Distance Driven",
        value: "About 100 m",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Rocks Analysed",
        value: "16 rocks",
        sourceIds: ["S-NASA-PATHFINDER"],
      },
    ],
    thumbnailImage: "/images/sites/mars-pathfinder/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1996-068A",
      "S-NASA-PATHFINDER",
      "S-3D-MARS-ROVER",
    ],
  },
  {
    id: "spirit-lander",
    tier: "secondary",
    name: "Columbia Memorial Station",
    subtitle:
      "The petal platform that cushioned Spirit's airbag landing in Gusev Crater",
    mission: "Mars Exploration Rover-A (Spirit)",
    nssdcaId: "2003-027A",
    year: 2004,
    lat: -14.5692,
    lon: 175.4729,
    region: "Gusev Crater",
    primaryCategory: "lander",
    categories: ["lander"],
    parentHeroId: "spirit-rover",
    summary:
      "Named for the crew of Space Shuttle Columbia, this three-petal tetrahedral lander bounced to a stop in Gusev Crater on 4 January 2004. Its ramps let Spirit roll onto the surface, and the bright petals are still visible from orbit beside the rover's first tracks.",
    hardwareLeftBehind: [
      "Tetrahedral petal lander and egress ramps",
      "Deflated Vectran airbag cluster",
      "Columbia memorial plaque and Spirit's first wheel tracks",
    ],
    stats: [
      {
        label: "Landing Date",
        value: "4 January 2004",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Airbag Bounces",
        value: "About 28 bounces",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Rover Rolled Away",
        value: "Spirit drove 7.73 km",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Location",
        value: "Gusev Crater",
        sourceIds: ["S-NASA-MER"],
      },
    ],
    thumbnailImage: "/images/sites/spirit-lander/thumb.webp",
    sourceIds: ["S-NSSDCA-2003-027A", "S-NASA-MER", "S-HIRISE-HARDWARE"],
  },
  {
    id: "opportunity-lander",
    tier: "secondary",
    name: "Challenger Memorial Station",
    subtitle:
      "The lander that scored a hole-in-one inside Eagle Crater and opened a water story",
    mission: "Mars Exploration Rover-B (Opportunity)",
    nssdcaId: "2003-032A",
    year: 2004,
    lat: -1.9462,
    lon: -5.5268,
    region: "Eagle Crater, Meridiani Planum",
    primaryCategory: "lander",
    categories: ["lander"],
    parentHeroId: "opportunity-rover",
    summary:
      "After bouncing 26 times across Meridiani Planum, Opportunity's airbags rolled into 22-metre Eagle Crater—a landing so lucky it was called a hole-in-one. The petals opened onto flat bedrock studded with hematite spheres that had formed in ancient water.",
    hardwareLeftBehind: [
      "Challenger Memorial Station petal lander",
      "Deflated Vectran airbag cluster and egress ramps",
      "Exposed Eagle Crater bedrock outcrop beside the lander",
    ],
    stats: [
      {
        label: "Crater Diameter",
        value: "22 m",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "Landing Date",
        value: "25 January 2004",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "Airbag Bounces",
        value: "About 26 bounces",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "First Find",
        value: "Water-formed hematite spheres",
        sourceIds: ["S-NASA-MER"],
      },
    ],
    thumbnailImage: "/images/sites/opportunity-eagle-lander/thumb.webp",
    sourceIds: ["S-NSSDCA-2003-032A", "S-NASA-MER", "S-HIRISE-HARDWARE"],
  },
];
