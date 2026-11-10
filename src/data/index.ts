import { EARTH_HERO_SITES } from "./earthHeroSites";
import { EARTH_SECONDARY_SITES } from "./earthSecondarySites";
import { EARTH_TOUR_CHAPTERS } from "./earthTourChapters";
import { HERO_SITES } from "./heroSites";
import { MARS_HERO_SITES } from "./marsHeroSites";
import { MARS_SECONDARY_SITES } from "./marsSecondarySites";
import { MARS_TOUR_CHAPTERS } from "./marsTourChapters";
import type { CelestialBody, HeroSite, LunarSite, SecondarySite, TourChapter } from "./schema";
import { SECONDARY_SITES } from "./secondarySites";
import { SOURCES, SOURCES_BY_ID } from "./sources";
import { TOUR_CHAPTERS } from "./tourChapters";

export {
  EARTH_HERO_SITES,
  EARTH_SECONDARY_SITES,
  EARTH_TOUR_CHAPTERS,
  HERO_SITES,
  SECONDARY_SITES,
  MARS_HERO_SITES,
  MARS_SECONDARY_SITES,
  SOURCES,
  SOURCES_BY_ID,
  TOUR_CHAPTERS,
  MARS_TOUR_CHAPTERS,
};

export const MOON_SITES: readonly LunarSite[] = [
  ...HERO_SITES,
  ...SECONDARY_SITES,
];

export const MARS_SITES: readonly LunarSite[] = [
  ...MARS_HERO_SITES,
  ...MARS_SECONDARY_SITES,
];

/** Default export alias for Lunar sites (backward-compatible) */
export const ALL_SITES: readonly LunarSite[] = MOON_SITES;

export const ALL_EARTH_SITES: readonly LunarSite[] = [
  ...EARTH_HERO_SITES,
  ...EARTH_SECONDARY_SITES,
];

export const EVERY_PLANETARY_SITE: readonly LunarSite[] = [
  ...MOON_SITES,
  ...ALL_EARTH_SITES,
  ...MARS_SITES,
];

export const ALL_COMBINED_SITES: readonly LunarSite[] = EVERY_PLANETARY_SITE;

export const SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  EVERY_PLANETARY_SITE.map((site) => [site.id, site]),
);

export const EARTH_SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  ALL_EARTH_SITES.map((s) => [s.id, s]),
);

const MARS_ID_SET = new Set(MARS_SITES.map((s) => s.id));

export function getSiteBody(siteId: string): CelestialBody {
  if (MARS_ID_SET.has(siteId)) return "mars";
  if (EARTH_SITE_BY_ID.has(siteId)) return "earth";
  return "moon";
}

export function getSitesForBody(body: CelestialBody): readonly LunarSite[] {
  if (body === "mars") return MARS_SITES;
  if (body === "earth") return ALL_EARTH_SITES;
  return MOON_SITES;
}

export function getHeroSitesForBody(body: CelestialBody): readonly HeroSite[] {
  if (body === "mars") return MARS_HERO_SITES;
  if (body === "earth") return EARTH_HERO_SITES;
  return HERO_SITES;
}

export function getSecondarySitesForBody(body: CelestialBody): readonly SecondarySite[] {
  if (body === "mars") return MARS_SECONDARY_SITES;
  if (body === "earth") return EARTH_SECONDARY_SITES;
  return SECONDARY_SITES;
}

export function getTourChaptersForBody(body: CelestialBody): readonly TourChapter[] {
  if (body === "mars") return MARS_TOUR_CHAPTERS;
  if (body === "earth") return EARTH_TOUR_CHAPTERS;
  return TOUR_CHAPTERS;
}

export function isNearside(lon: number): boolean {
  return Math.abs(lon) <= 90;
}
