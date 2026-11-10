import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ALL_SITES,
  EVERY_PLANETARY_SITE,
  HERO_SITES,
  MARS_HERO_SITES,
  MARS_SECONDARY_SITES,
  MARS_SITES,
  MARS_TOUR_CHAPTERS,
  SECONDARY_SITES,
  SITE_BY_ID,
  SOURCES,
  SOURCES_BY_ID,
  TOUR_CHAPTERS,
} from "./index";
import {
  HeroSiteSchema,
  SecondarySiteSchema,
  SourceEntrySchema,
  TourChapterSchema,
} from "./schema";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

describe("NASA Open Data & Lunar + Mars Content Integrity", () => {
  it("validates all source bibliography entries against SourceEntrySchema with unique IDs", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(24);
    const seen = new Set<string>();
    for (const s of SOURCES) {
      const parsed = SourceEntrySchema.safeParse(s);
      expect(parsed.success).toBe(true);
      expect(seen.has(s.id)).toBe(false);
      seen.add(s.id);
    }
  });

  it("validates all 9 Moon Hero Sites and 20 Moon Secondary Sites (29 total)", () => {
    expect(HERO_SITES.length).toBe(9);
    expect(SECONDARY_SITES.length).toBe(20);
    expect(ALL_SITES.length).toBe(29);

    for (const site of HERO_SITES) {
      const res = HeroSiteSchema.safeParse(site);
      if (!res.success) {
        throw new Error(`Invalid Moon hero site ${site.id}: ${res.error.message}`);
      }
    }

    for (const site of SECONDARY_SITES) {
      const res = SecondarySiteSchema.safeParse(site);
      if (!res.success) {
        throw new Error(`Invalid Moon secondary site ${site.id}: ${res.error.message}`);
      }
    }
  });

  it("validates all 9 Mars Hero Sites and 20 Mars Secondary Sites (29 total)", () => {
    expect(MARS_HERO_SITES.length).toBe(9);
    expect(MARS_SECONDARY_SITES.length).toBe(20);
    expect(MARS_SITES.length).toBe(29);
    expect(EVERY_PLANETARY_SITE.length).toBe(82);

    for (const site of MARS_HERO_SITES) {
      const res = HeroSiteSchema.safeParse(site);
      if (!res.success) {
        throw new Error(`Invalid Mars hero site ${site.id}: ${res.error.message}`);
      }
    }

    for (const site of MARS_SECONDARY_SITES) {
      const res = SecondarySiteSchema.safeParse(site);
      if (!res.success) {
        throw new Error(`Invalid Mars secondary site ${site.id}: ${res.error.message}`);
      }
    }
  });

  it("ensures every site ID is unique and every referenced sourceId and parentHeroId resolves", () => {
    const ids = new Set<string>();
    for (const site of EVERY_PLANETARY_SITE) {
      expect(ids.has(site.id)).toBe(false);
      ids.add(site.id);

      for (const sid of site.sourceIds) {
        expect(SOURCES_BY_ID.has(sid)).toBe(true);
      }
      for (const stat of site.stats) {
        for (const sid of stat.sourceIds) {
          expect(SOURCES_BY_ID.has(sid)).toBe(true);
        }
      }

      if (site.tier === "hero") {
        for (const sid of site.loroIntro.sourceIds) {
          expect(SOURCES_BY_ID.has(sid)).toBe(true);
        }
        for (const sid of site.memoryLog.sourceIds) {
          expect(SOURCES_BY_ID.has(sid)).toBe(true);
        }
        if (site.model3d) {
          expect(SOURCES_BY_ID.has(site.model3d.sourceId)).toBe(true);
        }
      } else if (site.parentHeroId) {
        const parent = SITE_BY_ID.get(site.parentHeroId);
        expect(parent?.tier).toBe("hero");
      }
    }
  });

  it("verifies that every image and 3D model path referenced in Moon and Mars sites exists in /public", () => {
    for (const site of EVERY_PLANETARY_SITE) {
      const thumbDisk = path.join(PUBLIC_DIR, site.thumbnailImage);
      expect(existsSync(thumbDisk)).toBe(true);

      if (site.tier === "hero") {
        const thenDisk = path.join(PUBLIC_DIR, site.thenNow.thenImage);
        const nowDisk = path.join(PUBLIC_DIR, site.thenNow.nowImage);
        expect(existsSync(thenDisk)).toBe(true);
        expect(existsSync(nowDisk)).toBe(true);

        if (site.model3d) {
          const glbDisk = path.join(PUBLIC_DIR, site.model3d.glbPath);
          expect(existsSync(glbDisk)).toBe(true);
        }
      }
    }
  });

  it("validates all 5 Moon Guided Tour chapters and all 5 Mars Guided Tour chapters", () => {
    expect(TOUR_CHAPTERS.length).toBe(5);
    expect(MARS_TOUR_CHAPTERS.length).toBe(5);

    for (const ch of [...TOUR_CHAPTERS, ...MARS_TOUR_CHAPTERS]) {
      const parsed = TourChapterSchema.safeParse(ch);
      expect(parsed.success).toBe(true);
      for (const hid of ch.heroSiteIds) {
        expect(SITE_BY_ID.get(hid)?.tier).toBe("hero");
      }
      for (const beat of ch.beats) {
        if (beat.kind === "flySite" || beat.kind === "spotlightWidget") {
          expect(SITE_BY_ID.has(beat.siteId)).toBe(true);
        }
      }
    }
  });
});
