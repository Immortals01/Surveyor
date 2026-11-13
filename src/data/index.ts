import { HERO_SITES } from "./heroSites";
import { HOST_INTRO_MARS, HOST_INTRO_MOON } from "./host";
import { MARS_HERO_SITES } from "./marsHeroSites";
import { MARS_SECONDARY_SITES } from "./marsSecondarySites";
import { MARS_TOUR_CHAPTERS } from "./marsTourChapters";
import type { CelestialBody, HeroSite, LunarSite, SecondarySite, TourChapter } from "./schema";
import { SECONDARY_SITES } from "./secondarySites";
import { SOURCES, SOURCES_BY_ID } from "./sources";
import { TOUR_CHAPTERS } from "./tourChapters";

export {
  HERO_SITES,
  SECONDARY_SITES,
  MARS_HERO_SITES,
  MARS_SECONDARY_SITES,
  HOST_INTRO_MOON,
  HOST_INTRO_MARS,
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

export const EVERY_PLANETARY_SITE: readonly LunarSite[] = [
  ...MOON_SITES,
  ...MARS_SITES,
];

export const ALL_COMBINED_SITES: readonly LunarSite[] = EVERY_PLANETARY_SITE;

export const SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  EVERY_PLANETARY_SITE.map((site) => [site.id, site]),
);

const MARS_ID_SET = new Set(MARS_SITES.map((s) => s.id));

export function getSiteBody(siteId: string): CelestialBody {
  if (MARS_ID_SET.has(siteId)) return "mars";
  return "moon";
}

export function getSitesForBody(body: CelestialBody): readonly LunarSite[] {
  if (body === "mars") return MARS_SITES;
  return MOON_SITES;
}

export function getHeroSitesForBody(body: CelestialBody): readonly HeroSite[] {
  if (body === "mars") return MARS_HERO_SITES;
  return HERO_SITES;
}

export function getSecondarySitesForBody(body: CelestialBody): readonly SecondarySite[] {
  if (body === "mars") return MARS_SECONDARY_SITES;
  return SECONDARY_SITES;
}

export function getTourChaptersForBody(body: CelestialBody): readonly TourChapter[] {
  if (body === "mars") return MARS_TOUR_CHAPTERS;
  return TOUR_CHAPTERS;
}

export function isNearside(lon: number): boolean {
  return Math.abs(lon) <= 90;
}
