import { useMemo, useState } from "react";
import { MapPin, Search, Sparkles, X } from "lucide-react";
import { getSitesForBody, isNearside } from "@/data";
import { cameraBus } from "@/engine/camera";
import { getCategoryMeta } from "@/lib/constants";
import { formatLatLon, normalizeLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";

export default function SiteIndex() {
  const open = useAppStore((s) => s.siteIndexOpen);
  const setOpen = useAppStore((s) => s.setSiteIndexOpen);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const selectSite = useAppStore((s) => s.selectSite);
  const enterExplore = useAppStore((s) => s.enterExplore);
  const mode = useAppStore((s) => s.mode);
  const setSunDirection = useAppStore((s) => s.setSunDirection);

  const [query, setQuery] = useState("");
  const sites = getSitesForBody(celestialBody);
  const categoryMeta = getCategoryMeta(celestialBody);
  const isMars = celestialBody === "mars";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (!q) return true;
      return (
        site.name.toLowerCase().includes(q) ||
        site.mission.toLowerCase().includes(q) ||
        site.region.toLowerCase().includes(q) ||
        site.subtitle.toLowerCase().includes(q) ||
        String(site.year).includes(q)
      );
    });
  }, [sites, query]);

  if (!open) return null;

  const handleJump = (site: (typeof sites)[number]) => {
    if (mode !== "explore") {
      enterExplore(true);
    }
    if (isMars) {
      setSunDirection(normalizeLon(site.lon - 18), 8);
    } else if (!isNearside(site.lon)) {
      setSunDirection(site.lon > 0 ? 140 : -140, 1.5);
    }
    selectSite(site.id);
    setOpen(false);
    void cameraBus.flyToLatLon(site.lat, site.lon);
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={
        isMars ? "All Martian Hardware Directory" : "All Lunar Hardware Directory"
      }
    >
      <div className="flex max-h-[82dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-loro/35 bg-space-950/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-loro uppercase">
              {`Accessible Hardware Directory (${sites.length} Verified ${isMars ? "Mars" : "Lunar"} Sites)`}
            </p>
            <h2 className="font-display text-xl font-bold text-regolith-bright">
              {`Jump to Any ${isMars ? "Martian" : "Lunar"} Artifact`}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-full border border-white/15 p-2 text-regolith hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close site directory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-regolith/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isMars
                  ? "Search Viking, Opportunity, InSight, Ingenuity, Jezero..."
                  : "Search Apollo 11, Surveyor, LRV, ALSEP, Tycho, 1972..."
              }
              className="w-full rounded-xl border border-white/15 bg-space-900/90 py-2.5 pr-4 pl-10 text-sm text-regolith-bright placeholder:text-regolith/45 focus:border-loro focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="hud-scroll flex-1 divide-y divide-white/8 overflow-y-auto px-3 py-2">
          {filtered.map((site) => {
            const cat = categoryMeta[site.primaryCategory];
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => handleJump(site)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate font-display text-sm font-semibold text-regolith-bright">
                      {site.name}
                    </span>
                    {site.tier === "hero" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-sunlit/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-sunlit">
                        <Sparkles className="h-2.5 w-2.5" /> Hero
                      </span>
                    )}
                    {!isMars && !isNearside(site.lon) && (
                      <span className="rounded-full bg-purple-400/15 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                        Farside
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-regolith/70">
                    {site.region} · {site.subtitle}
                  </p>
                </div>

                <div className="shrink-0 text-right font-mono text-[11px] text-regolith/70">
                  <div className="text-regolith-bright">{site.year}</div>
                  <div className="inline-flex items-center gap-1 text-[10px] text-loro/80">
                    <MapPin className="h-2.5 w-2.5" />
                    {formatLatLon(site.lat, site.lon)}
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-regolith/60">
              No{" "}
              {isMars
                ? "Martian artifacts"
                : "lunar artifacts"}{" "}
              matched &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
