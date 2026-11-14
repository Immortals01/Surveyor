export const MOON_RADIUS_KM = 1737.4;
export const EARTH_RADIUS_KM = 6371.0;
export const HEIGHT_EXAGGERATION = 3;

export const MARS_RADIUS_KM = 3396.2;
export const MARS_HEIGHT_EXAGGERATION = 2.6;

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

export const MARS_CATEGORY_META = {
  lander: {
    label: "Landers & Probes",
    shortLabel: "Landers",
    color: "#ffcf70",
  },
  rover: {
    label: "Mars Rovers",
    shortLabel: "Rovers",
    color: "#ff9f5c",
  },
  experiment: {
    label: "Seismic & ISRU Labs",
    shortLabel: "Science",
    color: "#7ee787",
  },
  active: {
    label: "Active Surface Missions",
    shortLabel: "Still Active",
    color: "#5ce1ff",
  },
  impact: {
    label: "Aeroshells & Impacts",
    shortLabel: "Impacts",
    color: "#c4a7ff",
  },
  future: {
    label: "Sample Return Frontier",
    shortLabel: "Sample Return",
    color: "#ffffff",
  },
} as const;

export function getCategoryMeta(body: "moon" | "mars") {
  if (body === "mars") return MARS_CATEGORY_META;
  return CATEGORY_META;
}

/** Bump when regenerating narration MP3s so immutable CDN copies are bypassed. */
export const NARRATION_ASSET_VERSION = "v7";
