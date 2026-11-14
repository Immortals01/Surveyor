import type { LunarSite } from "./schema";
import media from "./siteGalleryMedia.json";

export interface SiteGalleryItem {
  kind: "image" | "video";
  src: string;
  caption: string;
  credit: string;
  poster?: string;
}

interface GalleryImage {
  src: string;
  caption: string;
  credit: string;
  nasaId: string;
}

const MEDIA_BY_GROUP = media as Record<string, GalleryImage[]>;

const GROUP_BY_SITE: Record<string, string> = {
  "surveyor-1": "surveyor-1",
  "surveyor-3": "surveyor-3",
  "surveyor-5": "surveyor-5",
  "surveyor-6": "surveyor-6",
  "surveyor-7": "surveyor-7",
  "apollo-11": "apollo-11",
  "apollo-11-easep": "apollo-11",
  "apollo-12": "apollo-12",
  "apollo-12-alsep": "apollo-12",
  "apollo-14": "apollo-14",
  "apollo-14-alsep": "apollo-14",
  "apollo-15": "apollo-15",
  "apollo-15-alsep": "apollo-15",
  "apollo-15-lrv": "apollo-15",
  "apollo-16": "apollo-16",
  "apollo-16-alsep": "apollo-16",
  "apollo-16-lrv": "apollo-16",
  "apollo-17": "apollo-17",
  "apollo-17-alsep": "apollo-17",
  "apollo-17-lrv": "apollo-17",
  "viking-1": "viking-1",
  "viking-2": "viking-2",
  "mars-pathfinder": "pathfinder",
  "sojourner-rover": "pathfinder",
  "spirit-rover": "spirit",
  "spirit-lander": "spirit",
  "opportunity-rover": "opportunity",
  "opportunity-lander": "opportunity",
  "phoenix-lander": "phoenix",
  "insight-lander": "insight",
  "ingenuity-helicopter": "ingenuity",
};

const VIDEOS_BY_SITE: Record<string, SiteGalleryItem> = {
  "ingenuity-helicopter": {
    kind: "video",
    src: "/videos/ingenuity-4th-flight.mp4",
    poster: "/images/sites/gallery/ingenuity-1.webp",
    caption: "Ingenuity's fourth flight, recorded by the helicopter",
    credit: "NASA/JPL-Caltech",
  },
};

export function getSiteGallery(site: LunarSite): SiteGalleryItem[] {
  const leadImage = site.tier === "hero" ? site.archivePlate.image : site.thumbnailImage;
  const leadCaption =
    site.tier === "hero"
      ? site.archivePlate.caption
      : site.name;

  const images: SiteGalleryItem[] = [
    {
      kind: "image",
      src: leadImage,
      caption: leadCaption,
      credit: "",
    },
  ];

  const group = GROUP_BY_SITE[site.id];
  const extras = group ? (MEDIA_BY_GROUP[group] ?? []) : [];
  for (const extra of extras) {
    images.push({
      kind: "image",
      src: extra.src,
      caption: extra.caption,
      credit: extra.credit,
    });
  }

  const video = VIDEOS_BY_SITE[site.id];
  return video ? [...images, video] : images;
}
