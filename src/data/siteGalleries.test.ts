import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "bun:test";
import { EVERY_PLANETARY_SITE } from "./index";
import { getSiteGallery } from "./siteGalleries";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

describe("site galleries", () => {
  it("gives every Moon and Mars site 2-4 NASA media items", () => {
    for (const site of EVERY_PLANETARY_SITE) {
      const gallery = getSiteGallery(site);
      expect(gallery.length, `${site.id} gallery length`).toBeGreaterThanOrEqual(2);
      expect(gallery.length, `${site.id} gallery length`).toBeLessThanOrEqual(4);
      expect(gallery[0]?.kind, `${site.id} first item is an image`).toBe("image");

      for (const item of gallery) {
        expect(item.src.startsWith("/"), `${site.id} local media path`).toBe(true);
        expect(
          existsSync(path.join(PUBLIC_DIR, item.src)),
          `Missing ${item.src} for ${site.id}`,
        ).toBe(true);
        if (item.kind === "video") {
          expect(item.poster?.startsWith("/")).toBe(true);
          expect(existsSync(path.join(PUBLIC_DIR, item.poster!))).toBe(true);
        }
      }
    }
  });
});
