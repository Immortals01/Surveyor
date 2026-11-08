import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { latLonToVector3 } from "@/lib/geo";
import {
  ALL_SITES,
  HERO_SITES,
  SECONDARY_SITES,
  SITE_BY_ID,
  SOURCES,
  SOURCES_BY_ID,
  TOUR_CHAPTERS,
} from "./index";
import { SiteSchema, SourceEntrySchema, TourChapterSchema } from "./schema";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

describe("NASA dataset integrity & citation ledger", () => {
  it("validates all source entries against SourceEntrySchema with unique IDs", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(15);
    const seen = new Set<string>();
    for (const src of SOURCES) {
      expect(() => SourceEntrySchema.parse(src)).not.toThrow();
      expect(seen.has(src.id)).toBe(false);
      seen.add(src.id);
    }
  });

  it("contains exactly 9 hero sites and >= 20 secondary sites passing SiteSchema", () => {
    expect(HERO_SITES).toHaveLength(9);
    expect(SECONDARY_SITES.length).toBeGreaterThanOrEqual(20);

    const seenIds = new Set<string>();
    for (const site of ALL_SITES) {
      expect(() => SiteSchema.parse(site)).not.toThrow();
      expect(seenIds.has(site.id)).toBe(false);
      seenIds.add(site.id);
      expect(site.categories).toContain(site.primaryCategory);
    }
  });

  it("resolves every referenced sourceId across sites, stats, models, and tour beats", () => {
    for (const site of ALL_SITES) {
      for (const sid of site.sourceIds) {
        expect(SOURCES_BY_ID.has(sid), `${site.id} missing source ${sid}`).toBe(
          true,
        );
      }
      for (const stat of site.stats) {
        for (const sid of stat.sourceIds) {
          expect(
            SOURCES_BY_ID.has(sid),
            `${site.id} stat "${stat.label}" missing source ${sid}`,
          ).toBe(true);
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
      }
    }
  });

  it("validates all 5 tour chapters and ensures unique dialogue line IDs", () => {
    expect(TOUR_CHAPTERS).toHaveLength(5);
    const lineIds = new Set<string>();

    for (const ch of TOUR_CHAPTERS) {
      expect(() => TourChapterSchema.parse(ch)).not.toThrow();
      for (const hid of ch.heroSiteIds) {
        expect(SITE_BY_ID.get(hid)?.tier).toBe("hero");
      }
      for (const beat of ch.beats) {
        if (beat.kind === "flySite" || beat.kind === "spotlightWidget") {
          expect(SITE_BY_ID.has(beat.siteId)).toBe(true);
        }
        if (beat.kind === "speak") {
          for (const sid of beat.line.sourceIds) {
            expect(SOURCES_BY_ID.has(sid)).toBe(true);
          }
          lineIds.add(beat.line.id);
        }
        if (beat.kind === "spotlightWidget") {
          lineIds.add(beat.promptLine.id);
        }
      }
    }
  });

  it("places key lunar landmarks in the right selenographic quadrants", () => {
    // Apollo 11 (0.67N, 23.47E): nearside (+X), north (+Y), east (-Z)
    const ap11 = SITE_BY_ID.get("apollo-11")!;
    const p11 = latLonToVector3(ap11.lat, ap11.lon, 1);
    expect(p11.x).toBeGreaterThan(0.9);
    expect(p11.y).toBeGreaterThan(0);
    expect(p11.z).toBeLessThan(0);

    // Surveyor 1 (-2.47S, -43.34W): nearside (+X), south (-Y), west (+Z)
    const surv1 = SITE_BY_ID.get("surveyor-1")!;
    const ps1 = latLonToVector3(surv1.lat, surv1.lon, 1);
    expect(ps1.x).toBeGreaterThan(0.7);
    expect(ps1.y).toBeLessThan(0);
    expect(ps1.z).toBeGreaterThan(0.6);

    // LADEE (11.85N, -93.25W): farside (-X)
    const ladee = SITE_BY_ID.get("ladee")!;
    const pl = latLonToVector3(ladee.lat, ladee.lon, 1);
    expect(pl.x).toBeLessThan(0);
  });

  it("verifies all referenced public image and 3D model files exist on disk", () => {
    for (const site of ALL_SITES) {
      const thumbDisk = path.join(PUBLIC_DIR, site.thumbnailImage.slice(1));
      expect(existsSync(thumbDisk), `Missing ${site.thumbnailImage}`).toBe(
        true,
      );

      if (site.tier === "hero") {
        const thenDisk = path.join(PUBLIC_DIR, site.thenNow.thenImage.slice(1));
        const nowDisk = path.join(PUBLIC_DIR, site.thenNow.nowImage.slice(1));
        expect(existsSync(thenDisk), `Missing ${site.thenNow.thenImage}`).toBe(
          true,
        );
        expect(existsSync(nowDisk), `Missing ${site.thenNow.nowImage}`).toBe(
          true,
        );

        if (site.model3d) {
          const modelDisk = path.join(PUBLIC_DIR, site.model3d.glbPath.slice(1));
          expect(existsSync(modelDisk), `Missing ${site.model3d.glbPath}`).toBe(
            true,
          );
        }
      }
    }
  });
});
