import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { getSitesForBody, isNearside } from "@/data";
import { getMachineForSite } from "@/data/machines";
import { cameraBus } from "@/engine/camera";
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
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-space-950/80 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={
        isMars ? "All Martian Hardware Directory" : "All Lunar Hardware Directory"
      }
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden border border-white/12 bg-space-950 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-regolith/55 uppercase">
              Index
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-regolith-bright">
              {isMars ? "Martian hardware" : "Lunar hardware"}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-regolith/55">
              {sites.length} verified sites · click one to fly there
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer p-1.5 text-regolith/55 transition hover:text-regolith-bright focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close site directory"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-regolith/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isMars
                  ? "Viking, Opportunity, InSight, 1976…"
                  : "Apollo 11, Surveyor, LRV, ALSEP, 1972…"
              }
              className="w-full border-b border-white/15 bg-transparent py-3 pr-2 pl-7 text-sm text-regolith-bright placeholder:text-regolith/40 focus:border-regolith-bright focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="hud-scroll flex-1 overflow-y-auto">
          {filtered.map((site, i) => {
            const machine = getMachineForSite(site.id);
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => handleJump(site)}
                className={`group flex w-full cursor-pointer items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-loro focus-visible:outline-none ${
                  i > 0 ? "border-t border-white/8" : ""
                }`}
              >
                <span className="w-10 shrink-0 font-mono text-[11px] text-regolith/55 tabular-nums">
                  {site.year}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-display text-[15px] font-semibold text-regolith-bright">
                      {site.name}
                    </span>
                    {machine && (
                      <span
                        className="shrink-0 border px-1.5 py-px font-mono text-[8.5px] tracking-[0.14em] uppercase"
                        style={{ borderColor: `${machine.accent}66`, color: machine.accent }}
                      >
                        Speaks
                      </span>
                    )}
                    {site.tier === "hero" && !machine && (
                      <span className="shrink-0 font-mono text-[9px] tracking-[0.18em] text-sunlit/90 uppercase">
                        Hero
                      </span>
                    )}
                    {!isMars && !isNearside(site.lon) && (
                      <span className="shrink-0 font-mono text-[9px] tracking-[0.18em] text-regolith/45 uppercase">
                        Farside
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-regolith/65">
                    {site.subtitle}
                  </span>
                </span>

                <span className="shrink-0 text-right font-mono text-[11px] text-regolith/55 tabular-nums">
                  {formatLatLon(site.lat, site.lon)}
                </span>

                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-regolith/30 transition group-hover:text-regolith-bright" />
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="border-t border-white/8 px-6 py-10 text-center">
              <p className="text-sm text-regolith/65">
                Nothing matches &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-2 cursor-pointer font-mono text-[11px] text-loro underline underline-offset-4 hover:text-regolith-bright focus-visible:outline-none"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
