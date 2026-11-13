import { z } from "zod";

export const CategorySchema = z.enum([
  "lander",
  "rover",
  "experiment",
  "active",
  "impact",
  "future",
]);
export type Category = z.infer<typeof CategorySchema>;

export const LoRoMoodSchema = z.enum([
  "waving",
  "scanning",
  "narrating",
  "nostalgic",
  "excited",
]);
export type LoRoMood = z.infer<typeof LoRoMoodSchema>;

export const CelestialBodySchema = z.enum(["moon", "mars"]);
export type CelestialBody = z.infer<typeof CelestialBodySchema>;

export const DatasetPortalSchema = z.enum([
  "SVS",
  "LROC",
  "HIRISE",
  "MOLA",
  "NSSDCA",
  "ALSEP",
  "NASA-3D",
  "NASA-IVL",
  "LITERATURE",
]);
export type DatasetPortal = z.infer<typeof DatasetPortalSchema>;

export const SourceEntrySchema = z.object({
  id: z.string().regex(/^S-[A-Z0-9-]+$/),
  title: z.string(),
  agencyOrAuthor: z.string(),
  dataset: DatasetPortalSchema,
  url: z.string().url(),
  creditLine: z.string(),
});
export type SourceEntry = z.infer<typeof SourceEntrySchema>;

/**
 * A YouTube film embedded on one of the NASA pages this site cites.
 * `sourceId` records the exact ledger entry whose page carries the player,
 * so the right-panel embed can never drift away from its citation.
 */
export const SiteVideoSchema = z.object({
  youtubeId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/, "YouTube video IDs are 11 characters"),
  title: z.string().min(1),
  credit: z.string().min(1),
  sourceId: z.string().regex(/^S-[A-Z0-9-]+$/),
  description: z.string().min(1).optional(),
});
export type SiteVideo = z.infer<typeof SiteVideoSchema>;

export const StatItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  sourceIds: z.array(z.string()).min(1),
});
export type StatItem = z.infer<typeof StatItemSchema>;

export const DialogueLineSchema = z.object({
  id: z.string().min(1),
  speaker: z.enum(["loro", "equipment"]),
  speakerLabel: z.string().optional(),
  mood: LoRoMoodSchema.default("narrating"),
  text: z.string().min(1).max(360),
  sourceIds: z.array(z.string()).default([]),
});
export type DialogueLine = z.infer<typeof DialogueLineSchema>;

export const BaseSiteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  tier: z.enum(["hero", "secondary"]),
  name: z.string(),
  subtitle: z.string(),
  mission: z.string(),
  nssdcaId: z.string(),
  year: z.number().int().min(1959).max(2035),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  region: z.string(),
  primaryCategory: CategorySchema,
  categories: z.array(CategorySchema).min(1),
  summary: z.string(),
  hardwareLeftBehind: z.array(z.string()).min(1),
  stats: z.array(StatItemSchema).min(2),
  thumbnailImage: z.string().startsWith("/"),
  parentHeroId: z.string().optional(),
  sourceIds: z.array(z.string()).min(1),
  video: SiteVideoSchema.optional(),
});

export const HeroSiteSchema = BaseSiteSchema.extend({
  tier: z.literal("hero"),
  loroIntro: DialogueLineSchema,
  memoryLog: DialogueLineSchema,
  scienceImpact: z.string(),
  artemisLink: z.string(),
  archivePlate: z.object({
    image: z.string().startsWith("/"),
    caption: z.string(),
    year: z.number().int(),
  }),
});

export const SecondarySiteSchema = BaseSiteSchema.extend({
  tier: z.literal("secondary"),
});

export const SiteSchema = z.discriminatedUnion("tier", [
  HeroSiteSchema,
  SecondarySiteSchema,
]);

export type HeroSite = z.infer<typeof HeroSiteSchema>;
export type SecondarySite = z.infer<typeof SecondarySiteSchema>;
export type LunarSite = z.infer<typeof SiteSchema>;

export const TourBeatSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("flySite"),
    siteId: z.string(),
    sunLon: z.number().min(-180).max(180).optional(),
    sunLat: z.number().min(-90).max(90).optional(),
    announce: DialogueLineSchema.optional(),
  }),
  z.object({
    kind: z.literal("flyOverview"),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    distance: z.number().positive().optional(),
    sunLon: z.number().min(-180).max(180).optional(),
    announce: DialogueLineSchema.optional(),
  }),
  z.object({
    kind: z.literal("speak"),
    line: DialogueLineSchema,
    siteId: z.string().optional(),
  }),
]);
export type TourBeat = z.infer<typeof TourBeatSchema>;

export const TourChapterSchema = z.object({
  id: z.string(),
  number: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  title: z.string(),
  shortTitle: z.string(),
  subtitle: z.string(),
  heroSiteIds: z.array(z.string()).min(1),
  beats: z.array(TourBeatSchema).min(1),
});
export type TourChapter = z.infer<typeof TourChapterSchema>;
