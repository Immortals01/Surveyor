export const MOON_RADIUS_KM = 1737.4;
export const HEIGHT_EXAGGERATION = 3;

export const CAMERA = {
  homeDistance: 3.15,
  minDistance: 1.03,
  maxDistance: 7.5,
  siteAltitude: 0.28,
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
