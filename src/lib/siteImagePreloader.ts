import { getSitesForBody } from "@/data";
import type { CelestialBody, LunarSite } from "@/data/schema";

const requestedUrls = new Set<string>();
const decodedUrls = new Set<string>();

export function getSiteImageUrl(site: LunarSite): string {
  return site.tier === "hero" ? site.archivePlate.image : site.thumbnailImage;
}

export function isSiteImageDecoded(url: string): boolean {
  return decodedUrls.has(url);
}

export function markSiteImageDecoded(url: string): void {
  decodedUrls.add(url);
}

export function preloadSiteImage(site: LunarSite): void {
  const url = getSiteImageUrl(site);
  if (!url || requestedUrls.has(url)) return;
  requestedUrls.add(url);
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    decodedUrls.add(url);
  };
  img.src = url;
}

export function preloadBodySiteImages(body: CelestialBody): void {
  const sites = getSitesForBody(body);
  // Preload hero sites first, then secondary sites during idle frames
  for (const s of sites) {
    if (s.tier === "hero") preloadSiteImage(s);
  }
  const timer = window.setTimeout(() => {
    for (const s of sites) {
      if (s.tier !== "hero") preloadSiteImage(s);
    }
  }, 350);
  void timer;
}
