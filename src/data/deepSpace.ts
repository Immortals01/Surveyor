export interface DeepSpaceEntry {
  id: string;
  name: string;
  location: string;
  status: string;
  summary: string;
  url: string;
  source: string;
  machineId?: string;
}

/** Hardware that is neither on the Moon nor on Mars. */
export const DEEP_SPACE_ENTRIES: readonly DeepSpaceEntry[] = [
  {
    id: "dawn",
    name: "Dawn",
    location: "Asteroid belt · Ceres",
    status: "Silent in orbit around Ceres since 2018",
    summary:
      "The first spacecraft to orbit two extraterrestrial worlds. Dawn mapped Vesta and Ceres, then ran out of hydrazine and went quiet in a stable, unpowered orbit.",
    url: "https://science.nasa.gov/mission/dawn/",
    source: "NASA Science · Dawn",
    machineId: "dawn",
  },
  {
    id: "near-shoemaker",
    name: "NEAR Shoemaker",
    location: "Near-Earth asteroid · 433 Eros",
    status: "Resting on Eros since 2001",
    summary:
      "The first spacecraft to orbit and then land on an asteroid. It studied Eros for a year before touching down and returning close-up images of the surface.",
    url: "https://science.nasa.gov/mission/near-shoemaker/",
    source: "NASA Science · NEAR Shoemaker",
  },
  {
    id: "pioneer",
    name: "Pioneer 10 & 11",
    location: "Interstellar space",
    status: "Silent and drifting outward",
    summary:
      "Pioneer 10 crossed the asteroid belt and flew past Jupiter; Pioneer 11 became the first spacecraft to fly past Saturn. Both are now silent, leaving the solar system.",
    url: "https://science.nasa.gov/mission/pioneer-10/",
    source: "NASA Science · Pioneer",
  },
  {
    id: "kepler",
    name: "Kepler",
    location: "Earth-trailing solar orbit",
    status: "Retired in 2018 after running out of fuel",
    summary:
      "A planet-hunting telescope that watched thousands of stars and showed that planets are common across the galaxy. It is now inactive in an Earth-trailing orbit.",
    url: "https://science.nasa.gov/mission/kepler/",
    source: "NASA Science · Kepler",
  },
];
