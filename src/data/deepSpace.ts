export interface DeepSpaceImage {
  src: string;
  caption: string;
  credit: string;
}

export interface DeepSpaceFact {
  label: string;
  value: string;
}

export interface DeepSpaceEntry {
  id: string;
  name: string;
  location: string;
  status: string;
  summary: string;
  story: readonly string[];
  facts: readonly DeepSpaceFact[];
  images: readonly DeepSpaceImage[];
}

export const DEEP_SPACE_ACCENTS: Record<string, string> = {
  dawn: "#5ce1ff",
  "near-shoemaker": "#ffcf70",
  pioneer: "#f4a261",
  kepler: "#c4b5fd",
};

/** Hardware that is neither on the Moon nor on Mars. */
export const DEEP_SPACE_ENTRIES: readonly DeepSpaceEntry[] = [
  {
    id: "dawn",
    name: "Dawn",
    location: "Asteroid belt · Ceres",
    status: "Silent in orbit around Ceres since 2018",
    summary:
      "The first spacecraft to orbit two extraterrestrial worlds. Dawn mapped Vesta and Ceres, then ran out of hydrazine and went quiet in a stable, unpowered orbit.",
    story: [
      "I was built to do something no spacecraft had ever done: orbit two different worlds. I left Earth in September 2007 with three ion engines that pushed me gently, day after day, on a pale blue beam.",
      "In 2011 I settled into orbit around Vesta, a battered asteroid the size of Arizona. I mapped its craters and giant canyon, then climbed away and aimed for Ceres.",
      "Ceres surprised me. Beneath its gray, cratered face I found bright salt deposits and a dark world that may once have held an ocean. For three years I circled it, taking pictures and measuring its gravity.",
      "My hydrazine finally ran out in October 2018. I cannot point my antenna or fire an engine anymore, but I am not falling. I remain in a quiet, stable orbit around Ceres, still circling the first dwarf planet humans ever visited.",
    ],
    facts: [
      { label: "Launched", value: "27 September 2007" },
      { label: "Worlds orbited", value: "Vesta and Ceres" },
      { label: "Propulsion", value: "Three ion engines" },
      { label: "Status", value: "Silent in a stable orbit" },
    ],
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
  },
  {
    id: "near-shoemaker",
    name: "NEAR Shoemaker",
    location: "Near-Earth asteroid · 433 Eros",
    status: "Resting on Eros since 2001",
    summary:
      "The first spacecraft to orbit and then land on an asteroid. It studied Eros for a year before touching down and returning close-up images of the surface.",
    story: [
      "I was named for a scientist who spent his life chasing stones from space. In February 1996 I left Earth to catch one of those stones: a potato-shaped asteroid called Eros.",
      "I missed my first chance to orbit it, so my team sent me around the Sun for another try. On Valentine's Day 2000 I finally became the first spacecraft to orbit an asteroid. For a year I photographed Eros from above, measuring its craters, ridges and strange saddle-shaped valley.",
      "When my mission was nearly over, my team tried something no one had attempted. They guided me down. On 12 February 2001 I touched the surface at walking speed and came to rest on Eros. I was the first spacecraft to land on an asteroid.",
      "I kept working for a few more days, sending back close-up pictures and measuring the soil beneath me. Then my power faded. I am still there, a small metal visitor resting on a world only 34 kilometres long.",
    ],
    facts: [
      { label: "Launched", value: "17 February 1996" },
      { label: "Orbited Eros", value: "14 February 2000" },
      { label: "Landed", value: "12 February 2001" },
      { label: "Status", value: "Resting on Eros" },
    ],
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
    story: [
      "We were twins, built to go where nothing had gone before. Pioneer 10 launched in 1972 and Pioneer 11 followed in 1973. Between us, we carried the first small plaque showing where humans live.",
      "Pioneer 10 flew through the asteroid belt, a place many engineers feared, and came out the other side. In December 1973 it became the first spacecraft to fly past Jupiter, sending back close-up views of its storms and giant magnetic field.",
      "Pioneer 11 took a bolder path. It used Jupiter's gravity to slingshot toward Saturn, and in September 1979 it became the first spacecraft to visit that ringed world.",
      "After that we kept going. Pioneer 10 crossed the orbit of Neptune and headed out of the solar system. Pioneer 11 followed. One by one our power supplies faded and our radios went quiet. We are still drifting outward, carrying our golden plaques into the dark, silent but never forgotten.",
    ],
    facts: [
      { label: "Launched", value: "1972 and 1973" },
      { label: "Jupiter", value: "Pioneer 10, 1973" },
      { label: "Saturn", value: "Pioneer 11, 1979" },
      { label: "Status", value: "Silent, heading outward" },
    ],
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
    story: [
      "I was a telescope with one job: stare at the same patch of sky and wait for tiny dips in starlight. Each dip could mean a planet passing in front of its star.",
      "I launched in March 2009 and watched more than 150,000 stars. For four years I found planets by the thousands, including rocky worlds and strange giants orbiting closer than Mercury. I showed humans that planets are not rare. They are everywhere.",
      "In 2013 one of my reaction wheels failed, and I could no longer hold steady. My team found a clever second life for me, using sunlight to balance the spacecraft. That began the K2 mission, and I kept finding more worlds.",
      "By 2018 I had almost no fuel left. NASA retired me in October, and I went silent in an orbit that trails Earth around the Sun. I am not looking at the stars anymore, but the worlds I found are still waiting for someone to visit them.",
    ],
    facts: [
      { label: "Launched", value: "6 March 2009" },
      { label: "Stars watched", value: "More than 150,000" },
      { label: "Worlds found", value: "More than 2,600" },
      { label: "Status", value: "Retired in 2018" },
    ],
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
