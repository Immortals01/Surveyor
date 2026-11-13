import type { HeroSite } from "./schema";

/**
 * Mars hero sites — the eight landers, rovers and aircraft named on the 2026
 * challenge Resources tab: Viking 1 & 2, Mars Pathfinder, Spirit, Opportunity,
 * Phoenix, InSight and Ingenuity. Facts come from NSSDCA records and NASA
 * Science mission pages.
 */
export const MARS_HERO_SITES: HeroSite[] = [
  {
    id: "viking-1",
    tier: "hero",
    name: "Viking 1: Mutch Memorial Station",
    subtitle:
      "The first lander to make a home on Mars and send back a sunrise from another world",
    mission: "Viking 1",
    nssdcaId: "1975-075C",
    year: 1976,
    lat: 22.697,
    lon: -48.222,
    region: "Chryse Planitia (Plains of Gold)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Viking 1 touched down on Chryse Planitia on 20 July 1976, seven years to the day after Apollo 11. For more than six Earth years its cameras, weather boom and soil lab studied the rusty plains, and its biology experiments began the long search for life on Mars.",
    hardwareLeftBehind: [
      "572 kg hexagonal lander on three crushable footpads",
      "Three-metre sampler arm with biology and chemistry instruments",
      "Twin SNAP-19 radioisotope generators and S-band dish antenna",
    ],
    stats: [
      {
        label: "Surface Lifetime",
        value: "2,245 sols (6.3 years)",
        sourceIds: ["S-NSSDCA-1975-075C"],
      },
      {
        label: "Landed Mass",
        value: "572 kg",
        sourceIds: ["S-NSSDCA-1975-075C"],
      },
      {
        label: "Landing Date",
        value: "20 July 1976",
        sourceIds: ["S-NSSDCA-1975-075C"],
      },
      {
        label: "First Portrait",
        value: "First clear Mars surface image",
        sourceIds: ["S-NASA-VIKING"],
      },
    ],
    loroIntro: {
      id: "mars-viking1-intro",
      speaker: "loro",
      mood: "excited",
      text: "Down on the golden plains of Chryse Planitia sits the pioneer that started it all: Viking 1! From orbit its bright triangular deck still catches the sunlight, with the discarded backshell nearby.",
      sourceIds: ["S-NSSDCA-1975-075C", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-viking1-memory",
      speaker: "equipment",
      speakerLabel: "VIKING 1 LANDER · CHRYSE PLANITIA (JULY 1976)",
      mood: "nostalgic",
      text: "Twenty-five seconds after my engines stopped, my camera looked down at my own silver footpad resting among pebbles and salmon dust. For two thousand Martian mornings I watched frost sparkle and storms roll past, proving a robot could make a home here.",
      sourceIds: ["S-NSSDCA-1975-075C"],
    },
    scienceImpact:
      "Viking 1 gave humanity its first long weather record and soil chemistry from Mars, and its images and atmospheric data are still used to calibrate orbiters today.",
    artemisLink:
      "Viking's decades-long weather and dust record helps engineers design the shelters and power systems for the first human crews on Mars.",
    archivePlate: {
      image: "/images/sites/viking-1/then.webp",
      caption:
        "Viking 1's first surface panorama across boulder-strewn Chryse Planitia with the rock 'Big Joe' at left (1976).",
      year: 1976,
    },
    thumbnailImage: "/images/sites/viking-1/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1975-075C",
      "S-NASA-VIKING",
      "S-HIRISE-HARDWARE",
      "S-MOLA-MEGDR",
    ],
  },
  {
    id: "viking-2",
    tier: "hero",
    name: "Viking 2: Soffen Memorial Station",
    subtitle:
      "The northern twin that photographed winter frost glittering on Martian rocks",
    mission: "Viking 2",
    nssdcaId: "1975-083C",
    year: 1976,
    lat: 47.968,
    lon: 134.28,
    region: "Utopia Planitia",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Viking 2 landed on Utopia Planitia on 3 September 1976 with one footpad perched on a rock, giving the deck a noticeable tilt. It operated for 1,281 sols and photographed white winter frost coating the rocks—early evidence of water ice in the northern plains.",
    hardwareLeftBehind: [
      "572 kg Viking 2 lander on three crushable footpads",
      "Extendable sampler arm and meteorology boom",
      "Twin SNAP-19 radioisotope generators and a seismometer",
    ],
    stats: [
      {
        label: "Surface Lifetime",
        value: "1,281 sols (3.6 years)",
        sourceIds: ["S-NSSDCA-1975-083C"],
      },
      {
        label: "Landing Date",
        value: "3 September 1976",
        sourceIds: ["S-NSSDCA-1975-083C"],
      },
      {
        label: "Winter Discovery",
        value: "Water-ice frost on rocks",
        sourceIds: ["S-NSSDCA-1975-083C"],
      },
      {
        label: "Deck Tilt",
        value: "One footpad on a rock",
        sourceIds: ["S-NASA-VIKING"],
      },
    ],
    loroIntro: {
      id: "mars-viking2-intro",
      speaker: "loro",
      mood: "scanning",
      text: "Way up in the northern plains of Utopia Planitia, Viking 2 sits slightly tilted with one foot on a rock. Each winter, frost dusts its deck—one of the first hints of water ice on Mars.",
      sourceIds: ["S-NSSDCA-1975-083C", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-viking2-memory",
      speaker: "equipment",
      speakerLabel: "VIKING 2 LANDER · UTOPIA PLANITIA (SEPT 1976)",
      mood: "nostalgic",
      text: "I landed leaning a little to one side, my footpad balanced on a stone. When winter came, white frost crept across my rocks and my cameras caught it. I watched the seasons turn for more than a thousand sols before the cold finally won.",
      sourceIds: ["S-NSSDCA-1975-083C"],
    },
    scienceImpact:
      "Viking 2's frost images and weather record confirmed seasonal water-ice cycles in the northern plains and provided a second ground station for Mars meteorology.",
    artemisLink:
      "The northern plains Viking 2 explored are now a prime target for buried-ice prospecting that could supply water to future crews.",
    archivePlate: {
      image: "/images/sites/viking-2/then.webp",
      caption:
        "Viking 2's view across Utopia Planitia, where winter frost whitened the rocks around the lander (1977).",
      year: 1977,
    },
    thumbnailImage: "/images/sites/viking-2/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1975-083C",
      "S-NASA-VIKING",
      "S-HIRISE-HARDWARE",
      "S-MOLA-MEGDR",
    ],
  },
  {
    id: "mars-pathfinder",
    tier: "hero",
    name: "Pathfinder: Carl Sagan Memorial Station",
    subtitle:
      "The airbag-bouncing pyramid that unfolded to release the first rover on Mars",
    mission: "Mars Pathfinder",
    nssdcaId: "1996-068A",
    year: 1997,
    lat: 19.13,
    lon: -33.22,
    region: "Ares Vallis (ancient outflow channel)",
    primaryCategory: "lander",
    categories: ["lander", "rover"],
    summary:
      "On 4 July 1997 Mars Pathfinder hit the atmosphere, inflated giant airbags and bounced across Ares Vallis. When its three petals opened, the microwave-sized Sojourner rover rolled down a ramp to become the first wheeled explorer on another planet.",
    hardwareLeftBehind: [
      "Carl Sagan Memorial Station tetrahedral lander and deflated airbags",
      "Three petal panels and egress ramps",
      "IMP stereo camera mast and meteorology windsock",
    ],
    stats: [
      {
        label: "Airbag Bounces",
        value: "At least 15 bounces",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Landed Mass",
        value: "About 360 kg",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Images Returned",
        value: "16,500 lander images",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
      {
        label: "Landing Date",
        value: "4 July 1997",
        sourceIds: ["S-NSSDCA-1996-068A"],
      },
    ],
    loroIntro: {
      id: "mars-pathfinder-intro",
      speaker: "loro",
      mood: "excited",
      text: "Welcome to the ancient flood plain of Ares Vallis! Below us are Pathfinder's three open petals, still lying beside the rocks where little Sojourner made her first tracks.",
      sourceIds: ["S-NSSDCA-1996-068A", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-pathfinder-memory",
      speaker: "equipment",
      speakerLabel: "PATHFINDER LANDER · ARES VALLIS (JULY 1997)",
      mood: "nostalgic",
      text: "I hit the ground wrapped in balloons and bounced like a skipped stone before my petals opened. Sojourner rolled down my ramp and drove away, and I relayed every picture she sent home until my battery finally faded after 83 sols.",
      sourceIds: ["S-NSSDCA-1996-068A"],
    },
    scienceImpact:
      "Pathfinder proved the airbag landing system and petal-lander design, while rounded pebbles at Ares Vallis showed that catastrophic floods once flowed across the region.",
    artemisLink:
      "Pathfinder's cheap, fast lander architecture became the model for NASA's modern Mars and lunar delivery missions.",
    archivePlate: {
      image: "/images/sites/mars-pathfinder/then.webp",
      caption:
        "Pathfinder's camera watching Sojourner press her APXS sensor against the 'Yogi' boulder (July 1997).",
      year: 1997,
    },
    thumbnailImage: "/images/sites/mars-pathfinder/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1996-068A",
      "S-NASA-PATHFINDER",
      "S-HIRISE-HARDWARE",
      "S-3D-MARS-ROVER",
    ],
  },
  {
    id: "spirit-rover",
    tier: "hero",
    name: "Spirit: The Troy Sand Trap",
    subtitle:
      "The 90-sol geologist that climbed a Martian mountain and lasted six years",
    mission: "Mars Exploration Rover-A (Spirit)",
    nssdcaId: "2003-027A",
    year: 2004,
    lat: -14.5684,
    lon: 175.4726,
    region: "Gusev Crater / Columbia Hills ('Home Plate')",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    summary:
      "Spirit was built for 90 sols but drove 7.73 kilometres across Gusev Crater, became the first robot to summit a hill on another planet, and discovered nearly pure silica hot-spring deposits when a broken wheel dragged through the soil. In 2009 it became stuck in soft sand at 'Troy' and spent its last months as a stationary science station.",
    hardwareLeftBehind: [
      "185 kg Spirit rover resting at 'Troy' west of Home Plate",
      "Pancam mast, Rock Abrasion Tool and Mössbauer spectrometers",
      "Twin wheel tracks and the scuffed silica trench",
    ],
    stats: [
      {
        label: "Planned vs Actual",
        value: "90 sols → 2,208 sols",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Distance Driven",
        value: "7.73 km",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Images Returned",
        value: "124,000+",
        sourceIds: ["S-NSSDCA-2003-027A"],
      },
      {
        label: "Lucky Discovery",
        value: "Opaline silica hot-spring deposits",
        sourceIds: ["S-NASA-MER"],
      },
    ],
    loroIntro: {
      id: "mars-spirit-intro",
      speaker: "loro",
      mood: "nostalgic",
      text: "Look at the bright layered plateau inside Gusev Crater called Home Plate! Along its western edge rests Spirit, who turned a broken wheel into the luckiest geology tool on Mars.",
      sourceIds: ["S-NSSDCA-2003-027A", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-spirit-memory",
      speaker: "equipment",
      speakerLabel: "SPIRIT (MER-A) · TROY, HOME PLATE (2009–2010)",
      mood: "nostalgic",
      text: "When my right-front wheel seized, I drove backward for years—and that dragging wheel scraped open bright white silica from an ancient hot spring. Now my wheels are tucked in soft powder beside Home Plate, facing the hills I climbed.",
      sourceIds: ["S-NSSDCA-2003-027A"],
    },
    scienceImpact:
      "Spirit's silica deposits near Home Plate showed that Gusev Crater once hosted hydrothermal springs or steam vents—habitable environments for ancient microbes.",
    artemisLink:
      "Hydrothermal silica like Spirit found remains a top target for astrobiologists planning human-led sampling on Mars.",
    archivePlate: {
      image: "/images/sites/spirit-rover/then.webp",
      caption:
        "Spirit's panorama from the Columbia Hills overlooking the rusty floor of Gusev Crater (2005).",
      year: 2005,
    },
    thumbnailImage: "/images/sites/spirit-rover/thumb.webp",
    sourceIds: [
      "S-NSSDCA-2003-027A",
      "S-NASA-MER",
      "S-HIRISE-HARDWARE",
      "S-3D-MARS-ROVER",
    ],
  },
  {
    id: "opportunity-rover",
    tier: "hero",
    name: "Opportunity: Perseverance Valley",
    subtitle:
      "The marathon champion that drove 45 kilometres across Mars for nearly 15 years",
    mission: "Mars Exploration Rover-B (Opportunity)",
    nssdcaId: "2003-032A",
    year: 2004,
    lat: -2.28,
    lon: -5.42,
    region: "Meridiani Planum / Endeavour Crater rim",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    summary:
      "Opportunity landed inside tiny Eagle Crater on 25 January 2004 and immediately found hematite 'blueberries' formed in ancient water. Dust devils kept cleaning its solar panels, letting it drive 45.16 kilometres—the first off-world marathon—before a planet-wide dust storm silenced it in June 2018.",
    hardwareLeftBehind: [
      "185 kg Opportunity rover resting in Perseverance Valley",
      "45.16 km of wheel tracks across Meridiani Planum",
      "Pancam mast, Rock Abrasion Tool and Mössbauer spectrometer",
    ],
    stats: [
      {
        label: "Total Odometer",
        value: "45.16 km",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "Mission Duration",
        value: "5,352 sols (14.9 years)",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "Images Returned",
        value: "217,594",
        sourceIds: ["S-NSSDCA-2003-032A"],
      },
      {
        label: "Water Evidence",
        value: "Hematite 'blueberries' and gypsum veins",
        sourceIds: ["S-NASA-MER"],
      },
    ],
    loroIntro: {
      id: "mars-opportunity-intro",
      speaker: "loro",
      mood: "nostalgic",
      text: "Along the western rim of 22-kilometre Endeavour Crater lies Perseverance Valley, where marathon legend Opportunity rests after 5,352 sols. From orbit we can still follow her tracks across four craters.",
      sourceIds: ["S-NSSDCA-2003-032A", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-opportunity-memory",
      speaker: "equipment",
      speakerLabel: "OPPORTUNITY (MER-B) · PERSEVERANCE VALLEY (2018)",
      mood: "nostalgic",
      text: "Engineers promised me ninety days; Mars gave me five thousand suns. Whenever dust dimmed my wings, a whirlwind swept them clean so I could roll on. When the great storm turned noon to midnight, my last message home was that my battery was low and it was getting dark.",
      sourceIds: ["S-NSSDCA-2003-032A"],
    },
    scienceImpact:
      "Opportunity proved that ancient Mars had standing, pH-neutral water and shallow playas capable of supporting microbial life.",
    artemisLink:
      "Opportunity's fifteen-year traverse taught controllers how to run long-range robotic explorers across a whole planet.",
    archivePlate: {
      image: "/images/sites/opportunity-rover/then.webp",
      caption:
        "Opportunity looking back at her twin wheel tracks curving across the wind-rippled plains of Meridiani Planum.",
      year: 2010,
    },
    thumbnailImage: "/images/sites/opportunity-rover/thumb.webp",
    sourceIds: [
      "S-NSSDCA-2003-032A",
      "S-NASA-MER",
      "S-HIRISE-HARDWARE",
      "S-3D-MARS-ROVER",
    ],
  },
  {
    id: "phoenix-lander",
    tier: "hero",
    name: "Phoenix: Polar Water-Ice Digger",
    subtitle:
      "The Arctic scout that uncovered bright water ice just centimetres below the soil",
    mission: "Phoenix Mars Lander",
    nssdcaId: "2007-034A",
    year: 2008,
    lat: 68.2188,
    lon: -125.7492,
    region: "Vastitas Borealis (Martian Arctic)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Phoenix landed inside the Martian Arctic Circle in May 2008 and used its 2.35-metre robotic arm to scrape away about five centimetres of soil. Beneath it lay gleaming slabs of water ice, and its laser instrument later watched snow crystals fall from polar clouds before winter froze the lander's solar panels.",
    hardwareLeftBehind: [
      "350 kg Phoenix lander with octagonal UltraFlex solar arrays",
      "2.35 m digging arm, TEGA bake ovens and wet chemistry lab",
      "Meteorology mast and the Mars DVD time capsule",
    ],
    stats: [
      {
        label: "Landing Latitude",
        value: "68.22°N",
        sourceIds: ["S-NSSDCA-2007-034A"],
      },
      {
        label: "Ice Depth",
        value: "About 5 cm below the surface",
        sourceIds: ["S-NSSDCA-2007-034A"],
      },
      {
        label: "Weather Surprise",
        value: "Falling water-ice snow",
        sourceIds: ["S-NASA-PHOENIX"],
      },
      {
        label: "Mission Length",
        value: "About 5 months on the surface",
        sourceIds: ["S-NSSDCA-2007-034A"],
      },
    ],
    loroIntro: {
      id: "mars-phoenix-intro",
      speaker: "loro",
      mood: "scanning",
      text: "Far north in the plains of Vastitas Borealis sits Phoenix. Every winter, dry-ice frost buries its octagonal solar wings—and every spring, orbiters check how the arctic ice has weathered it.",
      sourceIds: ["S-NSSDCA-2007-034A", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-phoenix-memory",
      speaker: "equipment",
      speakerLabel: "PHOENIX LANDER · VASTITAS BOREALIS (2008)",
      mood: "nostalgic",
      text: "My own thruster blast blew away enough topsoil to reveal a smooth slab of water ice right beneath my belly. When my scoop dug up bright white dice of ice and we watched them vanish over four sols, there was no doubt: Mars keeps buried treasure at its poles.",
      sourceIds: ["S-NSSDCA-2007-034A"],
    },
    scienceImpact:
      "Phoenix confirmed shallow subsurface water ice across the northern plains, detected calcium carbonate and perchlorate salts, and measured falling Martian snow.",
    artemisLink:
      "The polar ice Phoenix touched is the key resource for making drinking water and rocket propellant on future crewed Mars missions.",
    archivePlate: {
      image: "/images/sites/phoenix-lander/then.webp",
      caption:
        "Phoenix's 'Dodo-Goldilocks' trench exposing bright water ice that sublimated over four days (2008).",
      year: 2008,
    },
    thumbnailImage: "/images/sites/phoenix-lander/thumb.webp",
    sourceIds: [
      "S-NSSDCA-2007-034A",
      "S-NASA-PHOENIX",
      "S-HIRISE-HARDWARE",
      "S-MOLA-MEGDR",
    ],
  },
  {
    id: "insight-lander",
    tier: "hero",
    name: "InSight: Marsquake Listener",
    subtitle:
      "The copper-shielded stethoscope that felt 1,319 marsquakes and mapped the planet's core",
    mission: "InSight",
    nssdcaId: "2018-042A",
    year: 2018,
    lat: 4.5024,
    lon: 135.6234,
    region: "Elysium Planitia",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    summary:
      "InSight landed on flat Elysium Planitia in November 2018 and used a robotic arm to place its SEIS seismometer directly on the ground under a wind shield. Before dust choked its solar arrays in December 2022, it recorded 1,319 marsquakes—including a magnitude 4.7 event—and measured the size of Mars's liquid core.",
    hardwareLeftBehind: [
      "358 kg InSight lander with two decagonal solar arrays",
      "SEIS seismometer under its copper-coloured wind and thermal shield",
      "HP3 'Mole' heat probe and RISE radio-science antennas",
    ],
    stats: [
      {
        label: "Marsquakes Logged",
        value: "1,319 events",
        sourceIds: ["S-NSSDCA-2018-042A"],
      },
      {
        label: "Biggest Quake",
        value: "Magnitude 4.7 (May 2022)",
        sourceIds: ["S-NSSDCA-2018-042A"],
      },
      {
        label: "Core Radius",
        value: "About 1,830 km",
        sourceIds: ["S-NSSDCA-2018-042A"],
      },
      {
        label: "Mission End",
        value: "December 2022",
        sourceIds: ["S-NASA-INSIGHT"],
      },
    ],
    loroIntro: {
      id: "mars-insight-intro",
      speaker: "loro",
      mood: "scanning",
      text: "Out on the smooth plains of Elysium Planitia sits InSight—the first robot to place a seismometer directly on Martian soil. In front of its deck you can see the bright dome of the SEIS wind shield.",
      sourceIds: ["S-NSSDCA-2018-042A", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-insight-memory",
      speaker: "equipment",
      speakerLabel: "INSIGHT SEIS · ELYSIUM PLANITIA (2018–2022)",
      mood: "narrating",
      text: "Tucked under my white-and-gold dome, I listened to the quietest heartbeat in the solar system. I felt faults pop beneath Cerberus Fossae, heard meteoroids open fresh craters far away, and measured Mars's molten heart before the dust tucked me in.",
      sourceIds: ["S-NSSDCA-2018-042A"],
    },
    scienceImpact:
      "InSight measured the thickness of the Martian crust, found a large light-element-rich liquid core, and recorded seismic waves from meteoroid impacts that exposed subsurface ice.",
    artemisLink:
      "InSight's marsquake catalogue gives engineers the ground-shaking hazard maps they need before building habitats on Mars.",
    archivePlate: {
      image: "/images/sites/insight-lander/then.webp",
      caption:
        "InSight's copper-and-white SEIS seismometer dome on Elysium Planitia beside the HP3 heat probe (2019).",
      year: 2019,
    },
    thumbnailImage: "/images/sites/insight-lander/thumb.webp",
    sourceIds: [
      "S-NSSDCA-2018-042A",
      "S-NASA-INSIGHT",
      "S-HIRISE-HARDWARE",
      "S-MOLA-MEGDR",
    ],
  },
  {
    id: "ingenuity-helicopter",
    tier: "hero",
    name: "Ingenuity: Valinor Hills",
    subtitle:
      "The 1.8-kilogram flyer that made 72 flights in air a hundred times thinner than Earth's",
    mission: "Ingenuity Mars Helicopter",
    nssdcaId: "2020-052B",
    year: 2021,
    lat: 18.497,
    lon: 77.311,
    region: "Neretva Vallis / 'Valinor Hills' (Jezero Crater)",
    primaryCategory: "future",
    categories: ["future", "experiment"],
    summary:
      "Ingenuity was meant to attempt five flights in thirty days. Instead the 1.8-kilogram helicopter—carrying a scrap of fabric from the 1903 Wright Flyer—flew 72 times over nearly three years, scouting 17 kilometres of Jezero Crater before a hard landing in sand ripples damaged a rotor blade in January 2024.",
    hardwareLeftBehind: [
      "1.8 kg Ingenuity coaxial helicopter standing at 'Valinor Hills'",
      "Detached carbon-fibre rotor blade tip in the sand nearby",
      "Postage-stamp swatch of 1903 Wright Flyer wing fabric",
    ],
    stats: [
      {
        label: "Total Flights",
        value: "72 (planned: 5)",
        sourceIds: ["S-NSSDCA-2020-052B"],
      },
      {
        label: "Rotor Speed",
        value: "About 2,537 RPM",
        sourceIds: ["S-NSSDCA-2020-052B"],
      },
      {
        label: "Distance Flown",
        value: "17.0 km",
        sourceIds: ["S-NSSDCA-2020-052B"],
      },
      {
        label: "Flight Time",
        value: "About 2 hours 8 minutes",
        sourceIds: ["S-NASA-INGENUITY"],
      },
    ],
    loroIntro: {
      id: "mars-ingenuity-intro",
      speaker: "loro",
      mood: "excited",
      text: "Up in the wind-carved ripples of Neretva Vallis stands little Ingenuity! Even with a chipped rotor tip after 72 historic flights, she is still standing tall and recording weather data.",
      sourceIds: ["S-NSSDCA-2020-052B", "S-HIRISE-HARDWARE"],
    },
    memoryLog: {
      id: "mars-ingenuity-memory",
      speaker: "equipment",
      speakerLabel: "INGENUITY · VALINOR HILLS (JAN 2024)",
      mood: "nostalgic",
      text: "Everyone wondered whether blades could bite into air a hundred times thinner than Earth's—so I spun my carbon-fibre wings at 2,537 RPM and leaped into the amber sky seventy-two times. My flying days ended on these dunes, but the skies of Mars are open forever.",
      sourceIds: ["S-NSSDCA-2020-052B"],
    },
    scienceImpact:
      "Ingenuity proved that powered flight works in the thin Martian atmosphere and now serves as a stationary weather and avionics testbed in Jezero Crater.",
    artemisLink:
      "Ingenuity opened the door for future Mars sample-recovery helicopters and science drones that will scout terrain ahead of astronauts.",
    archivePlate: {
      image: "/images/sites/ingenuity-helicopter/then.webp",
      caption:
        "Perseverance's SuperCam view of Ingenuity standing on the Valinor Hills sand after Flight 72 (2024).",
      year: 2024,
    },
    thumbnailImage: "/images/sites/ingenuity-helicopter/thumb.webp",
    sourceIds: [
      "S-NSSDCA-2020-052B",
      "S-NASA-INGENUITY",
      "S-HIRISE-HARDWARE",
      "S-3D-MARS-ROVER",
    ],
  },
];
