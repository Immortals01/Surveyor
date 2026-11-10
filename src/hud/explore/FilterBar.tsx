import { Globe2, Star } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { getSitesForBody } from "@/data";
import type { Category } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { getCategoryMeta } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

const FILTER_ORDER: Category[] = [
  "active",
  "lander",
  "rover",
  "experiment",
  "impact",
  "future",
];

export default function FilterBar() {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const heroOnly = useAppStore((s) => s.heroOnly);
  const setCategoryFilter = useAppStore((s) => s.setCategoryFilter);
  const setHeroOnly = useAppStore((s) => s.setHeroOnly);
  const setSunDirection = useAppStore((s) => s.setSunDirection);

  const sites = getSitesForBody(celestialBody);
  const categoryMeta = getCategoryMeta(celestialBody);
  const isMars = celestialBody === "mars";
  const isEarth = celestialBody === "earth";

  const visibleCount = sites.filter((site) => {
    if (heroOnly && site.tier !== "hero") return false;
    if (categoryFilter === "all") return true;
    return site.categories.includes(categoryFilter);
  }).length;

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-1 border border-white/15 bg-space-950/88 px-2.5 py-1.5 backdrop-blur-md">
      <button
        type="button"
        onClick={() => {
          audioEngine.playUiTick();
          setCategoryFilter("all");
        }}
        className={`cursor-pointer px-2.5 py-1 font-mono text-[11px] font-medium uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
          categoryFilter === "all"
            ? "bg-regolith-bright font-bold text-space-950"
            : "text-regolith/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        All ({sites.length})
      </button>

      {FILTER_ORDER.map((cat) => {
        const meta = categoryMeta[cat];
        const active = categoryFilter === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => {
              audioEngine.playUiTick();
              setCategoryFilter(active ? "all" : cat);
            }}
            className={`inline-flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
              active
                ? "border-white/50 bg-white/15 font-semibold text-white"
                : "border-transparent text-regolith/80 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <span>{meta.shortLabel}</span>
          </button>
        );
      })}

      <span className="hidden h-4 w-px bg-white/15 sm:inline-block" />

      <button
        type="button"
        onClick={() => {
          audioEngine.playUiTick();
          setHeroOnly(!heroOnly);
        }}
        className={`inline-flex cursor-pointer items-center gap-1 border px-2.5 py-1 font-mono text-[11px] uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
          heroOnly
            ? "border-sunlit/60 bg-sunlit/20 font-semibold text-sunlit"
            : "border-white/15 text-regolith/75 hover:border-sunlit/40 hover:text-sunlit"
        }`}
        title="Show only the 9 featured Hero Story sites"
      >
        <Star className="h-3 w-3" />
        <span>9 Featured</span>
      </button>

      {/* Quick Globe Hemisphere Jumps */}
      <div className="hidden items-center gap-1 lg:flex">
        <span className="mx-1 h-4 w-px bg-white/15" />
        <Globe2 className="h-3.5 w-3.5 text-loro/80" />
        {isMars ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSunDirection(60, 10);
                void cameraBus.flyOverview(18, 77, 2.75);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Jezero &amp; Syrtis
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(115, 6);
                void cameraBus.flyOverview(-2, 136, 2.75);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Gale &amp; Elysium
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(-140, 12);
                void cameraBus.flyOverview(18, -133, 2.65);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Olympus Mons
            </button>
          </>
        ) : isEarth ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSunDirection(-75, 15);
                void cameraBus.flyOverview(28, -90, 2.75);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Americas
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(30, 18);
                void cameraBus.flyOverview(36, 32, 2.75);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Eurasia
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(115, 10);
                void cameraBus.flyOverview(12, 118, 2.85);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Asia-Pacific
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setSunDirection(-48, 1.5);
                void cameraBus.flyOverview(8, 10, 2.75);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Near Side
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(145, 1.5);
                void cameraBus.flyOverview(8, 175, 2.85);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              Far Side
            </button>
            <button
              type="button"
              onClick={() => {
                setSunDirection(-48, -1.5);
                void cameraBus.flyOverview(-82, -30, 1.85);
              }}
              className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] text-regolith/75 hover:bg-white/10 hover:text-white"
            >
              South Pole
            </button>
          </>
        )}
      </div>

      <span className="ml-auto hidden font-mono text-[10px] text-regolith/55 xl:inline">
        {visibleCount} shown
      </span>
    </div>
  );
}
