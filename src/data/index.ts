import { HERO_SITES } from "./heroSites";
import type { LunarSite } from "./schema";
import { SECONDARY_SITES } from "./secondarySites";
import { SOURCES, SOURCES_BY_ID } from "./sources";
import { TOUR_CHAPTERS } from "./tourChapters";

export { HERO_SITES, SECONDARY_SITES, SOURCES, SOURCES_BY_ID, TOUR_CHAPTERS };

export const ALL_SITES: LunarSite[] = [...HERO_SITES, ...SECONDARY_SITES];

export const SITE_BY_ID: ReadonlyMap<string, LunarSite> = new Map(
  ALL_SITES.map((s) => [s.id, s]),
);

export function isNearside(lon: number): boolean {
  return Math.abs(lon) <= 90;
}
