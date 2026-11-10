export const MOON_RADIUS_KM = 1737.4;
export const EARTH_RADIUS_KM = 6371.0;
export const HEIGHT_EXAGGERATION = 3;

export const CAMERA = {
  homeDistance: 3.15,
  minAltitude: 0.28,
  minDistance: 1.28,
  maxDistance: 7.5,
  siteAltitude: 0.34,
  flyDurationMs: 2600,
} as const;

export const CATEGORY_META = {
  lander: {
    label: "Landers & Bases",
    shortLabel: "Landers",
    color: "#ffcf70",
  },
  rover: {
    label: "Lunar Rovers",
    shortLabel: "Rovers",
    color: "#ff9f5c",
  },
  experiment: {
    label: "Science Stations",
    shortLabel: "Science",
    color: "#7ee787",
  },
  active: {
    label: "Still Active Today",
    shortLabel: "Still Active",
    color: "#5ce1ff",
  },
  impact: {
    label: "Robotic Probes & Impacts",
    shortLabel: "Impacts",
    color: "#c4a7ff",
  },
  future: {
    label: "Artemis Frontier",
    shortLabel: "Artemis",
    color: "#ffffff",
  },
} as const;

export const EARTH_CATEGORY_META = {
  lander: {
    label: "Crewed Launch Complexes",
    shortLabel: "Crewed Pads",
    color: "#ffcf70",
  },
  rover: {
    label: "Planetary & Robotic Hubs",
    shortLabel: "Deep Space",
    color: "#ff9f5c",
  },
  experiment: {
    label: "Mission Control & DSN",
    shortLabel: "Control & DSN",
    color: "#7ee787",
  },
  active: {
    label: "Active Spaceports",
    shortLabel: "Spaceports",
    color: "#5ce1ff",
  },
  impact: {
    label: "Test Stands & Recovery",
    shortLabel: "Heritage",
    color: "#c4a7ff",
  },
  future: {
    label: "Artemis & Next-Gen",
    shortLabel: "Artemis",
    color: "#ffffff",
  },
} as const;

export function getCategoryMeta(body: "moon" | "earth") {
  return body === "earth" ? EARTH_CATEGORY_META : CATEGORY_META;
}
