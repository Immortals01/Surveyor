import type { SecondarySite } from "./schema";

/**
 * Moon secondary sites — the individual pieces of hardware that rode with the
 * eight Moon heroes: Surveyor landers, ALSEP/EASEP science stations and the
 * three Lunar Roving Vehicles named on the 2026 challenge Resources tab.
 */
export const SECONDARY_SITES: SecondarySite[] = [
  {
    id: "surveyor-3",
    tier: "secondary",
    name: "Surveyor 3: The Visited Robot",
    subtitle:
      "The only robot on the Moon that humans have walked up to and shaken hands with",
    mission: "Surveyor 3",
    nssdcaId: "1967-035A",
    year: 1967,
    lat: -2.99,
    lon: -23.34,
    region: "Oceanus Procellarum (Surveyor Crater)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    parentHeroId: "apollo-12",
    summary:
      "Surveyor 3 landed on 20 April 1967 and dug the first lunar trenches with a remote-controlled scoop. Thirty-one months later Pete Conrad and Alan Bean walked over from Intrepid, cut off its camera and scoop, and carried them home so engineers could see how space had aged a machine.",
    hardwareLeftBehind: [
      "Surveyor 3 lander body, three legs and solar panel",
      "Digging scoop and alpha-scattering chemistry instrument",
      "Camera mounting bracket, left empty after Apollo 12 removed the TV camera",
    ],
    stats: [
      {
        label: "Landed Mass",
        value: "About 302 kg",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
      {
        label: "Trenches Dug",
        value: "First robotic lunar digging",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
      {
        label: "Wait Before Visitors",
        value: "31 months",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
      {
        label: "Pieces Returned",
        value: "TV camera and scoop",
        sourceIds: ["S-NSSDCA-1967-035A"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-12-surveyor-3/thumb.webp",
    sourceIds: [
      "S-NSSDCA-1967-035A",
      "S-NASA-SURVEYOR",
      "S-LROC-FEATURED",
      "S-3D-SURVEYOR",
    ],
  },
  {
    id: "surveyor-5",
    tier: "secondary",
    name: "Surveyor 5: The Alpha-Scattering Chemist",
    subtitle:
      "The lander that survived a leaking valve and tasted lunar soil for the first time",
    mission: "Surveyor 5",
    nssdcaId: "1967-084A",
    year: 1967,
    lat: 1.4551,
    lon: 23.1943,
    region: "Mare Tranquillitatis (Sea of Tranquility)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "A helium leak threatened Surveyor 5's descent, so controllers improvised a new landing profile and brought it down safely on 11 September 1967. Its gold-plated alpha-scattering box then measured the chemistry of the Sea of Tranquility, showing the maria are volcanic basalt much like Earth's ocean-floor rock.",
    hardwareLeftBehind: [
      "Surveyor 5 lander frame and three crushable footpads",
      "Curium-242 alpha-scattering surface composition instrument",
      "Solar panel, battery and steerable planar antenna",
    ],
    stats: [
      {
        label: "Landed Mass",
        value: "About 303 kg",
        sourceIds: ["S-NSSDCA-1967-084A"],
      },
      {
        label: "Images Returned",
        value: "19,049 pictures",
        sourceIds: ["S-NSSDCA-1967-084A"],
      },
      {
        label: "Soil Chemistry",
        value: "Basaltic, like Earth's ocean floor",
        sourceIds: ["S-NSSDCA-1967-084A"],
      },
      {
        label: "Landing Date",
        value: "11 September 1967",
        sourceIds: ["S-NSSDCA-1967-084A"],
      },
    ],
    thumbnailImage: "/images/sites/surveyor-5/thumb.webp",
    sourceIds: ["S-NSSDCA-1967-084A", "S-WAGNER-2017", "S-3D-SURVEYOR"],
  },
  {
    id: "surveyor-6",
    tier: "secondary",
    name: "Surveyor 6: The First Lunar Hop",
    subtitle:
      "The only spacecraft to lift off from the Moon and land again a few metres away",
    mission: "Surveyor 6",
    nssdcaId: "1967-112A",
    year: 1967,
    lat: 0.4742,
    lon: -1.4275,
    region: "Sinus Medii (the Moon's near-side centre)",
    primaryCategory: "lander",
    categories: ["lander", "experiment"],
    summary:
      "Eight days after landing at the centre of the near side, Surveyor 6 fired its vernier engines for 2.5 seconds and hopped about 2.4 metres west. The manoeuvre let its camera photograph its own footpad craters in stereo—the first powered take-off from another world.",
    hardwareLeftBehind: [
      "Surveyor 6 lander and its original set of footpad craters",
      "Vernier engines that performed the first lunar hop",
      "Solar panel, battery and TV camera",
    ],
    stats: [
      {
        label: "Historic Hop",
        value: "2.4 m west, 2.5-second burn",
        sourceIds: ["S-NSSDCA-1967-112A"],
      },
      {
        label: "Images Returned",
        value: "30,027 pictures",
        sourceIds: ["S-NSSDCA-1967-112A"],
      },
      {
        label: "Landed Mass",
        value: "About 300 kg",
        sourceIds: ["S-NSSDCA-1967-112A"],
      },
      {
        label: "Landing Date",
        value: "10 November 1967",
        sourceIds: ["S-NSSDCA-1967-112A"],
      },
    ],
    thumbnailImage: "/images/sites/surveyor-6/thumb.webp",
    sourceIds: ["S-NSSDCA-1967-112A", "S-WAGNER-2017", "S-3D-SURVEYOR"],
  },
  {
    id: "apollo-11-easep",
    tier: "secondary",
    name: "Apollo 11 EASEP Package",
    subtitle:
      "The first science station on the Moon, unpacked in a single hour at Tranquility Base",
    mission: "Apollo 11",
    nssdcaId: "1969-059C",
    year: 1969,
    lat: 0.6739,
    lon: 23.4728,
    region: "Mare Tranquillitatis (Tranquility Base)",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-11",
    summary:
      "Because Apollo 11's spacewalk was short, its science came as one compact Early Apollo Scientific Experiments Package. Buzz Aldrin set the seismometer and the 100-prism laser retroreflector on the dust beside Eagle; the seismometer ran for three weeks while the mirror has answered Earth's lasers ever since.",
    hardwareLeftBehind: [
      "Passive Seismic Experiment with its solar panels and radio transmitter",
      "Laser Ranging Retroreflector with 100 fused-silica corner cubes",
      "Solar Wind Composition experiment foil and lunar dust detector",
    ],
    stats: [
      {
        label: "Deployed",
        value: "21 July 1969",
        sourceIds: ["S-NSSDCA-1969-059C"],
      },
      {
        label: "Seismometer Lifetime",
        value: "About 21 days",
        sourceIds: ["S-NSSDCA-1969-059C"],
      },
      {
        label: "Retroreflector Prisms",
        value: "100 corner cubes",
        sourceIds: ["S-LLR-SCIENCE"],
      },
      {
        label: "Still Working",
        value: "Laser ranging from Earth",
        sourceIds: ["S-LLR-SCIENCE"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-11/thumb.webp",
    sourceIds: ["S-NSSDCA-1969-059C", "S-LLR-SCIENCE", "S-ALSEP-ARCHIVE"],
  },
  {
    id: "apollo-12-alsep",
    tier: "secondary",
    name: "Apollo 12 ALSEP Station",
    subtitle:
      "The first nuclear-powered laboratory on the Moon, running through 95 lunar nights",
    mission: "Apollo 12",
    nssdcaId: "1969-099C",
    year: 1969,
    lat: -3.0098,
    lon: -23.4249,
    region: "Oceanus Procellarum (Surveyor Crater)",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-12",
    summary:
      "Apollo 12's ALSEP ran on a 73-watt SNAP-27 nuclear generator instead of solar panels, so it kept working through the two-week lunar night. From November 1969 to September 1977 it measured moonquakes, the solar wind and the Moon's magnetic field—almost eight years of continuous science.",
    hardwareLeftBehind: [
      "SNAP-27 radioisotope thermoelectric generator",
      "Passive Seismic Experiment, magnetometer and solar wind spectrometer",
      "Suprathermal ion detector, cold cathode gauge and dust detector",
    ],
    stats: [
      {
        label: "Station Lifetime",
        value: "7 years 10 months",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Power Source",
        value: "73 W plutonium-238 RTG",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Deployed",
        value: "19 November 1969",
        sourceIds: ["S-NSSDCA-1969-099C"],
      },
      {
        label: "Data Run",
        value: "Until 30 September 1977",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-12-alsep/thumb.webp",
    sourceIds: ["S-NSSDCA-1969-099C", "S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
  },
  {
    id: "apollo-14-alsep",
    tier: "secondary",
    name: "Apollo 14 ALSEP & Retroreflector",
    subtitle:
      "The Fra Mauro science station hauled out on a handcart and left listening for moonquakes",
    mission: "Apollo 14",
    nssdcaId: "1971-008C",
    year: 1971,
    lat: -3.645,
    lon: -17.48,
    region: "Fra Mauro Highlands",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-14",
    summary:
      "Alan Shepard and Edgar Mitchell towed their instruments across the Fra Mauro highlands on a small cart called the Modular Equipment Transporter. The ALSEP they deployed measured moonquakes and the solar wind, and its companion retroreflector joined the growing lunar laser-ranging network.",
    hardwareLeftBehind: [
      "Apollo 14 ALSEP central station and SNAP-27 generator",
      "Passive and active seismic experiments with geophones",
      "Laser Ranging Retroreflector array",
    ],
    stats: [
      {
        label: "Deployed",
        value: "6 February 1971",
        sourceIds: ["S-NSSDCA-1971-008C"],
      },
      {
        label: "Data Run",
        value: "Until 30 September 1977",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Seismic Instruments",
        value: "Passive and active experiments",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Laser Array",
        value: "Still used for ranging",
        sourceIds: ["S-LLR-SCIENCE"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-14-alsep/thumb.webp",
    sourceIds: ["S-NSSDCA-1971-008C", "S-ALSEP-ARCHIVE", "S-LLR-SCIENCE"],
  },
  {
    id: "apollo-15-alsep",
    tier: "secondary",
    name: "Apollo 15 ALSEP Station",
    subtitle:
      "The Hadley science station that measured heat leaking out of the Moon's interior",
    mission: "Apollo 15",
    nssdcaId: "1971-063C",
    year: 1971,
    lat: 26.134,
    lon: 3.63,
    region: "Hadley-Apennine",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-15",
    summary:
      "Apollo 15's ALSEP was the most elaborate yet, with a heat-flow experiment drilled into the regolith beside Hadley Rille. Together with its seismometer, magnetometer and solar wind sensors, it kept reporting until the network was switched off in 1977.",
    hardwareLeftBehind: [
      "Apollo 15 ALSEP central station and SNAP-27 generator",
      "Heat Flow Experiment borehole probes",
      "Passive seismometer, magnetometer and solar wind spectrometer",
    ],
    stats: [
      {
        label: "Deployed",
        value: "31 July 1971",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "Heat-Flow Probes",
        value: "Two boreholes into the regolith",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Data Run",
        value: "Until 30 September 1977",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Location",
        value: "Beside Hadley Rille",
        sourceIds: ["S-WAGNER-2017"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-15-lrrr/thumb.webp",
    sourceIds: ["S-NSSDCA-1971-063C", "S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
  },
  {
    id: "apollo-15-lrv",
    tier: "secondary",
    name: "LRV-1: The First Moon Buggy",
    subtitle:
      "The folded electric car that turned a walking mission into a 27.8-kilometre road trip",
    mission: "Apollo 15",
    nssdcaId: "1971-063C",
    year: 1971,
    lat: 26.1322,
    lon: 3.633,
    region: "Hadley-Apennine",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    parentHeroId: "apollo-15",
    summary:
      "Folded against Falcon's side during landing, the first Lunar Roving Vehicle unfolded into a wire-wheeled buggy on 31 July 1971. David Scott and Jim Irwin drove it 27.8 kilometres along Hadley Rille and the Apennine front, then parked it a short walk from the lander.",
    hardwareLeftBehind: [
      "LRV-1 chassis with four wire-mesh wheels and fold-out seats",
      "Two silver-zinc batteries and four 0.25-hp electric motors",
      "Hand controller, navigation gyro and television camera",
    ],
    stats: [
      {
        label: "Distance Driven",
        value: "27.8 km",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "Empty Mass",
        value: "About 210 kg",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "Top Speed",
        value: "About 13 km/h",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
      {
        label: "First Drive",
        value: "31 July 1971",
        sourceIds: ["S-NSSDCA-1971-063C"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-15-lrv/thumb.webp",
    sourceIds: ["S-NSSDCA-1971-063C", "S-WAGNER-2017", "S-3D-LRV"],
  },
  {
    id: "apollo-16-alsep",
    tier: "secondary",
    name: "Apollo 16 ALSEP Station",
    subtitle:
      "The highland station that listened to moonquakes in the bright Descartes terrain",
    mission: "Apollo 16",
    nssdcaId: "1972-031C",
    year: 1972,
    lat: -8.975,
    lon: 15.503,
    region: "Descartes Highlands",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-16",
    summary:
      "John Young and Charlie Duke deployed this ALSEP on the Descartes highlands in April 1972. Its seismometers, magnetometer and heat-flow probe added a highland anchor to the lunar network, and it continued returning data until the ALSEP stations were shut down in 1977.",
    hardwareLeftBehind: [
      "Apollo 16 ALSEP central station and SNAP-27 generator",
      "Passive and active seismic experiments",
      "Lunar Surface Magnetometer and Heat Flow Experiment",
    ],
    stats: [
      {
        label: "Deployed",
        value: "22 April 1972",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "Data Run",
        value: "Until 30 September 1977",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Terrain",
        value: "Ancient highland crust",
        sourceIds: ["S-WAGNER-2017"],
      },
      {
        label: "Seismic Role",
        value: "Highland anchor for the network",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-16-descartes/thumb.webp",
    sourceIds: ["S-NSSDCA-1972-031C", "S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
  },
  {
    id: "apollo-16-lrv",
    tier: "secondary",
    name: "LRV-2: The Highland Rover",
    subtitle:
      "The buggy that set the lunar land-speed record on the slopes of Stone Mountain",
    mission: "Apollo 16",
    nssdcaId: "1972-031C",
    year: 1972,
    lat: -8.972,
    lon: 15.499,
    region: "Descartes Highlands",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    parentHeroId: "apollo-16",
    summary:
      "LRV-2 carried John Young and Charlie Duke 26.7 kilometres across the Descartes highlands. On a downhill run from Stone Mountain it reached about 18 km/h—still the fastest anyone has driven on the Moon—before being parked near Orion.",
    hardwareLeftBehind: [
      "LRV-2 chassis and four wire-mesh wheels",
      "Two silver-zinc batteries and electric drive motors",
      "Television camera and lunar sample stowage",
    ],
    stats: [
      {
        label: "Distance Driven",
        value: "26.7 km",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "Speed Record",
        value: "About 18 km/h downhill",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "First Highland Drive",
        value: "April 1972",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
      {
        label: "Empty Mass",
        value: "About 210 kg",
        sourceIds: ["S-NSSDCA-1972-031C"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-16-descartes/thumb.webp",
    sourceIds: ["S-NSSDCA-1972-031C", "S-WAGNER-2017", "S-3D-LRV"],
  },
  {
    id: "apollo-17-alsep",
    tier: "secondary",
    name: "Apollo 17 ALSEP Station",
    subtitle:
      "The Taurus-Littrow station that measured the Moon's escaping heat and hunted gravity waves",
    mission: "Apollo 17",
    nssdcaId: "1972-096C",
    year: 1972,
    lat: 20.1923,
    lon: 30.7655,
    region: "Taurus-Littrow Valley",
    primaryCategory: "experiment",
    categories: ["experiment", "lander"],
    parentHeroId: "apollo-17",
    summary:
      "The last ALSEP ever deployed included heat-flow probes drilled into the valley floor, a surface gravimeter, a neutron probe and a dust detector. It completed the seismic network that let scientists map the Moon's interior, then fell silent with the rest of the stations in 1977.",
    hardwareLeftBehind: [
      "Apollo 17 ALSEP central station and SNAP-27 generator",
      "Two heat-flow boreholes and a lunar surface gravimeter",
      "Lunar Ejecta and Meteorites (LEAM) dust detector and neutron probe",
    ],
    stats: [
      {
        label: "Deployed",
        value: "12 December 1972",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Borehole Depth",
        value: "About 2.5 m into the regolith",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Data Run",
        value: "Until 30 September 1977",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
      {
        label: "Unique Instrument",
        value: "Lunar surface gravimeter",
        sourceIds: ["S-ALSEP-ARCHIVE"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-17-alsep/thumb.webp",
    sourceIds: ["S-NSSDCA-1972-096C", "S-ALSEP-ARCHIVE", "S-WAGNER-2017"],
  },
  {
    id: "apollo-17-lrv",
    tier: "secondary",
    name: "LRV-3: The Last Moon Buggy",
    subtitle:
      "The rover that drove 35.9 kilometres and was repaired with a folded map and a clamp",
    mission: "Apollo 17",
    nssdcaId: "1972-096C",
    year: 1972,
    lat: 20.19,
    lon: 30.775,
    region: "Taurus-Littrow Valley",
    primaryCategory: "rover",
    categories: ["rover", "experiment"],
    parentHeroId: "apollo-17",
    summary:
      "LRV-3 covered 35.9 kilometres in the Taurus-Littrow valley, the longest lunar drive ever. When a fender broke and dust sprayed the crew, Gene Cernan and Jack Schmitt taped on a replacement made from a map and clamps—a repair still visible in the tracks they left behind.",
    hardwareLeftBehind: [
      "LRV-3 chassis and four wire-mesh wheels",
      "Map-and-clamp fender repair on the right rear wheel",
      "Two silver-zinc batteries and a television camera",
    ],
    stats: [
      {
        label: "Distance Driven",
        value: "35.9 km (lunar record)",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Drive Time",
        value: "About 22 hours",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Fender Repair",
        value: "Map, tape and clamps",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
      {
        label: "Final Park",
        value: "December 1972",
        sourceIds: ["S-NSSDCA-1972-096C"],
      },
    ],
    thumbnailImage: "/images/sites/apollo-17-lrv/thumb.webp",
    sourceIds: ["S-NSSDCA-1972-096C", "S-WAGNER-2017", "S-3D-LRV"],
  },
];
