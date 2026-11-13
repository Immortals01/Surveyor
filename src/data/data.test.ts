import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "bun:test";
import { latLonToVector3 } from "@/lib/geo";
import { HOSTS, HOST_BY_SITE, HOST_ORDER } from "./hosts";
import {
  ALL_COMBINED_SITES,
  ALL_SITES,
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
import { SiteSchema, SourceEntrySchema, TourChapterSchema } from "./schema";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

describe("NASA dataset integrity & citation ledger", () => {
  it("validates all source entries against SourceEntrySchema with unique IDs", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(24);
    const seen = new Set<string>();
    for (const src of SOURCES) {
      expect(() => SourceEntrySchema.parse(src)).not.toThrow();
      expect(seen.has(src.id)).toBe(false);
      seen.add(src.id);
    }
  });

  it("contains 8 lunar heroes, 12 lunar secondaries, 8 Mars heroes and 3 Mars secondaries passing SiteSchema", () => {
    expect(HERO_SITES).toHaveLength(8);
    expect(SECONDARY_SITES).toHaveLength(12);
    expect(MARS_HERO_SITES).toHaveLength(8);
    expect(MARS_SECONDARY_SITES).toHaveLength(3);

    const seenIds = new Set<string>();
    for (const site of ALL_COMBINED_SITES) {
      expect(() => SiteSchema.parse(site)).not.toThrow();
      expect(seenIds.has(site.id)).toBe(false);
      seenIds.add(site.id);
      expect(site.categories).toContain(site.primaryCategory);
    }
  });

  it("resolves every referenced sourceId across Moon & Mars sites, stats, and tour beats", () => {
    for (const site of ALL_COMBINED_SITES) {
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
      }
    }
  });

  it("validates all 5 Moon and 5 Mars tour chapters and ensures unique dialogue line IDs", () => {
    expect(TOUR_CHAPTERS).toHaveLength(5);
    expect(MARS_TOUR_CHAPTERS).toHaveLength(5);
    const lineIds = new Set<string>();

    for (const ch of [...TOUR_CHAPTERS, ...MARS_TOUR_CHAPTERS]) {
      expect(() => TourChapterSchema.parse(ch)).not.toThrow();
      for (const hid of ch.heroSiteIds) {
        expect(SITE_BY_ID.get(hid)?.tier).toBe("hero");
      }
      for (const beat of ch.beats) {
        if (beat.kind === "flySite") {
          expect(SITE_BY_ID.has(beat.siteId)).toBe(true);
        }
        if (beat.kind === "speak") {
          for (const sid of beat.line.sourceIds) {
            expect(SOURCES_BY_ID.has(sid)).toBe(true);
          }
          expect(lineIds.has(beat.line.id)).toBe(false);
          lineIds.add(beat.line.id);
        }
      }
    }
  });

  it("validates the cartoon host cast and their self-introductions", () => {
    for (const id of HOST_ORDER) {
      const host = HOSTS[id];
      expect(host.id).toBe(id);
      expect(host.name.length).toBeGreaterThan(0);
      expect(host.intro.text.length).toBeGreaterThan(40);
      expect(host.intro.text.length).toBeLessThanOrEqual(360);
      for (const sid of host.intro.sourceIds) {
        expect(SOURCES_BY_ID.has(sid), `${id} intro missing source ${sid}`).toBe(true);
      }
      if (host.siteId) {
        expect(SITE_BY_ID.has(host.siteId), `${id} points at ${host.siteId}`).toBe(true);
        expect(HOST_BY_SITE[host.siteId]).toBe(id);
      }
    }

    // Every specialty host must actually take the stage somewhere in the tour.
    const tourSiteIds = new Set(
      TOUR_CHAPTERS.flatMap((ch) =>
        ch.beats.flatMap((b) => ("siteId" in b && b.siteId ? [b.siteId] : [])),
      ),
    );
    for (const id of HOST_ORDER) {
      const siteId = HOSTS[id].siteId;
      if (!siteId) continue;
      expect(tourSiteIds.has(siteId), `${id} never appears in the tour`).toBe(true);
    }
  });

  it("attributes every embedded mission film to a cited NASA source", () => {
    const videoSites = ALL_COMBINED_SITES.filter((site) => site.video !== undefined);
    expect(videoSites.length).toBeGreaterThan(0);

    for (const site of videoSites) {
      const video = site.video!;
      expect(video.youtubeId, `${site.id} video id`).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(site.sourceIds, `${site.id} cites ${video.sourceId}`).toContain(
        video.sourceId,
      );
      expect(SOURCES_BY_ID.has(video.sourceId), `${site.id} → ${video.sourceId}`).toBe(
        true,
      );
    }

    // Every NASA mission page that carries a YouTube embed must reach the UI.
    const videoSourceIds = new Set(videoSites.map((site) => site.video!.sourceId));
    for (const sid of ["S-NASA-PATHFINDER", "S-NASA-INSIGHT", "S-NASA-INGENUITY"]) {
      expect(videoSourceIds.has(sid), `no site embeds the film from ${sid}`).toBe(
        true,
      );
    }
  });

  it("places key Moon and Mars landmarks in the right geographic quadrants", () => {
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

    // Viking 2 (47.97N, 134.28E): far-eastern longitude (-Z), northern (+Y)
    const viking2 = SITE_BY_ID.get("viking-2")!;
    const pv2 = latLonToVector3(viking2.lat, viking2.lon, 1);
    expect(pv2.y).toBeGreaterThan(0.6);
    expect(pv2.z).toBeLessThan(-0.4);
  });

  it("verifies all referenced public image and texture files exist on disk", () => {
    expect(ALL_SITES.length + MARS_SITES.length).toBe(
      ALL_COMBINED_SITES.length,
    );
    expect(
      existsSync(path.join(PUBLIC_DIR, "textures/moon/moon_day_2k.webp")),
    ).toBe(true);

    for (const site of ALL_COMBINED_SITES) {
      const thumbDisk = path.join(PUBLIC_DIR, site.thumbnailImage.slice(1));
      expect(existsSync(thumbDisk), `Missing ${site.thumbnailImage}`).toBe(
        true,
      );

      if (site.tier === "hero") {
        const plateDisk = path.join(PUBLIC_DIR, site.archivePlate.image.slice(1));
        expect(existsSync(plateDisk), `Missing ${site.archivePlate.image}`).toBe(
          true,
        );
      }
    }
  });
});
