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

export const WidgetKindSchema = z.enum([
  "laser-retroreflector",
  "moonquake",
  "rover-liftoff-cam",
]);
export type WidgetKind = z.infer<typeof WidgetKindSchema>;

export const StoryTabSchema = z.enum([
  "story",
  "then-now",
  "science",
  "model",
]);
export type StoryTab = z.infer<typeof StoryTabSchema>;

export const DatasetPortalSchema = z.enum([
  "SVS",
  "LROC",
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

export const HotspotSchema = z.object({
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  label: z.string(),
});
export type Hotspot = z.infer<typeof HotspotSchema>;

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
});

export const HeroSiteSchema = BaseSiteSchema.extend({
  tier: z.literal("hero"),
  loroIntro: DialogueLineSchema,
  memoryLog: DialogueLineSchema,
  scienceImpact: z.string(),
  artemisLink: z.string(),
  thenNow: z.object({
    thenImage: z.string().startsWith("/"),
    thenCaption: z.string(),
    thenYear: z.number().int(),
    nowImage: z.string().startsWith("/"),
    nowCaption: z.string(),
    lrocImageId: z.string(),
    hotspots: z.array(HotspotSchema).default([]),
  }),
  model3d: z
    .object({
      glbPath: z.string().startsWith("/"),
      title: z.string(),
      caption: z.string(),
      scale: z.number().positive().default(1),
      sourceId: z.string(),
    })
    .optional(),
  widget: WidgetKindSchema.optional(),
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
    openTab: StoryTabSchema.optional(),
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
    openTab: StoryTabSchema.optional(),
  }),
  z.object({
    kind: z.literal("spotlightWidget"),
    siteId: z.string(),
    promptLine: DialogueLineSchema,
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
  beats: z.array(TourBeatSchema).min(2),
});
export type TourChapter = z.infer<typeof TourChapterSchema>;
