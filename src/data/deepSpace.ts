export interface DeepSpaceImage {
  src: string;
  caption: string;
  credit: string;
}

export interface DeepSpaceEntry {
  id: string;
  name: string;
  location: string;
  status: string;
  summary: string;
  url: string;
  source: string;
  images: readonly DeepSpaceImage[];
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
    images: [
      {
        src: "/images/deep-space/dawn-1.webp",
        caption: "Dawn orbiting Ceres, artist concept",
        credit: "NASA/JPL",
      },
      {
        src: "/images/deep-space/dawn-2.webp",
        caption: "Dawn in its cruise configuration",
        credit: "NASA/McREL",
      },
      {
        src: "/images/deep-space/dawn-3.webp",
        caption: "Tupo Crater on Ceres, seen by Dawn",
        credit: "NASA/JPL-Caltech/UCLA/MPS/DLR/IDA",
      },
    ],
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
    images: [
      {
        src: "/images/deep-space/near-1.webp",
        caption: "NEAR Shoemaker meets asteroid Eros, artist concept",
        credit: "NASA",
      },
      {
        src: "/images/deep-space/near-2.webp",
        caption: "A lacework surface on Eros",
        credit: "NASA/JPL/JHUAPL",
      },
      {
        src: "/images/deep-space/near-3.webp",
        caption: "The saddle region of Eros",
        credit: "NASA/JPL/JHUAPL",
      },
    ],
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
    images: [
      {
        src: "/images/deep-space/pioneer-1.webp",
        caption: "Pioneer 10 being prepared at Cape Kennedy",
        credit: "NASA Ames",
      },
      {
        src: "/images/deep-space/pioneer-2.webp",
        caption: "Pioneer passing Jupiter, artist concept",
        credit: "Rick Guidice / NASA Ames",
      },
      {
        src: "/images/deep-space/pioneer-3.webp",
        caption: "Pioneer 10 leaving Earth, artist concept",
        credit: "Don Moore / NASA Ames",
      },
    ],
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
    images: [
      {
        src: "/images/deep-space/kepler-1.webp",
        caption: "Kepler in the clean room",
        credit: "NASA/JPL-Caltech/Ball",
      },
      {
        src: "/images/deep-space/kepler-2.webp",
        caption: "Kepler assembled at Ball Aerospace",
        credit: "NASA/JPL-Caltech/Ball Aerospace",
      },
      {
        src: "/images/deep-space/kepler-3.webp",
        caption: "Kepler in space, artist concept",
        credit: "NASA/Ames/JPL-Caltech",
      },
    ],
  },
];
