import { EARTH_HERO_SITES } from "./earthHeroSites";
import { EARTH_SECONDARY_SITES } from "./earthSecondarySites";
import { EARTH_TOUR_CHAPTERS } from "./earthTourChapters";
import { HERO_SITES } from "./heroSites";
import type { HeroSite, LunarSite, TourChapter } from "./schema";
import { SECONDARY_SITES } from "./secondarySites";
import { SOURCES, SOURCES_BY_ID } from "./sources";
import { TOUR_CHAPTERS } from "./tourChapters";

export {
  EARTH_HERO_SITES,
  EARTH_SECONDARY_SITES,
  EARTH_TOUR_CHAPTERS,
  HERO_SITES,
  SECONDARY_SITES,
  SOURCES,
  SOURCES_BY_ID,
  TOUR_CHAPTERS,
};

export const ALL_SITES: LunarSite[] = [...HERO_SITES, ...SECONDARY_SITES];

export const ALL_EARTH_SITES: LunarSite[] = [
  ...EARTH_HERO_SITES,
  ...EARTH_SECONDARY_SITES,
];

export const ALL_COMBINED_SITES: LunarSite[] = [
  ...ALL_SITES,
  ...ALL_EARTH_SITES,
];

export const SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  ALL_COMBINED_SITES.map((s) => [s.id, s]),
);

export const EARTH_SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  ALL_EARTH_SITES.map((s) => [s.id, s]),
);

export function getSitesForBody(body: "moon" | "earth"): LunarSite[] {
  return body === "earth" ? ALL_EARTH_SITES : ALL_SITES;
}

export function getHeroSitesForBody(body: "moon" | "earth"): HeroSite[] {
  return body === "earth" ? EARTH_HERO_SITES : HERO_SITES;
}

export function getTourChaptersForBody(body: "moon" | "earth"): TourChapter[] {
  return body === "earth" ? EARTH_TOUR_CHAPTERS : TOUR_CHAPTERS;
}

export function isNearside(lon: number): boolean {
  return Math.abs(lon) <= 90;
}
