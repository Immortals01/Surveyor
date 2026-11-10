import { useEffect, useMemo, useRef } from "react";
import { BookOpen, ExternalLink, MapPin, ShieldCheck, X } from "lucide-react";
import { EVERY_PLANETARY_SITE, getSiteBody, SOURCES } from "@/data";
import type { DatasetPortal, SourceEntry } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { useAppStore } from "@/store/useAppStore";

const PORTAL_LABELS: Record<DatasetPortal, string> = {
  SVS: "NASA Scientific Visualization Studio (CGI Moon Kit & LOLA)",
  LROC: "Lunar Reconnaissance Orbiter Camera (LROC / ASU)",
  MOLA: "Mars Global Surveyor MOLA Altimetry & Viking MDIM 2.1 (USGS / PDS)",
  HIRISE: "Mars Reconnaissance Orbiter HiRISE Camera (JPL / UArizona)",
  NSSDCA: "NASA Space Science Data Coordinated Archive (NSSDCA)",
  ALSEP: "Apollo Lunar Surface Experiments & Seismic Archive",
  "NASA-3D": "NASA 3D Resources Official Spacecraft Models",
  "NASA-IVL": "NASA Image and Video Library",
  LITERATURE: "Peer-Reviewed Planetary Geodesy & Heritage Studies",
};

const PORTAL_ORDER: DatasetPortal[] = [
  "SVS",
  "LROC",
  "MOLA",
  "HIRISE",
  "NSSDCA",
  "ALSEP",
  "NASA-3D",
  "NASA-IVL",
  "LITERATURE",
];

export default function SourcesDrawer() {
  const open = useAppStore((s) => s.sourcesDrawerOpen);
  const highlightedSourceId = useAppStore((s) => s.highlightedSourceId);
  const closeSources = useAppStore((s) => s.closeSources);
  const selectSite = useAppStore((s) => s.selectSite);
  const enterExplore = useAppStore((s) => s.enterExplore);
  const setCelestialBody = useAppStore((s) => s.setCelestialBody);
  const mode = useAppStore((s) => s.mode);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (open && highlightedSourceId) {
      const el = cardRefs.current[highlightedSourceId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [open, highlightedSourceId]);

  const sitesBySourceId = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; lat: number; lon: number }>>();
    for (const site of EVERY_PLANETARY_SITE) {
      for (const sid of site.sourceIds) {
        const list = map.get(sid) ?? [];
        list.push({ id: site.id, name: site.name, lat: site.lat, lon: site.lon });
        map.set(sid, list);
      }
    }
    return map;
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<DatasetPortal, SourceEntry[]>();
    for (const portal of PORTAL_ORDER) {
      map.set(
        portal,
        SOURCES.filter((s) => s.dataset === portal),
      );
    }
    return map;
  }, []);

  if (!open) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="NASA Open Data Sources and Citations"
    >
      <div className="flex max-h-[86dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-loro/40 bg-space-950/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-loro/35 bg-loro/10 text-loro">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-wider text-loro uppercase">
                2026 NASA Space Apps Challenge · Open Science Bibliography
              </p>
              <h2 className="font-display text-xl font-bold text-regolith-bright">
                Verified NASA Open Datasets & Citations ({SOURCES.length})
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSources}
            className="cursor-pointer rounded-full border border-white/15 p-2 text-regolith hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close NASA data sources modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Grouped Catalog */}
        <div className="hud-scroll flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Mandatory Attribution Callout */}
          <div className="rounded-2xl border border-sunlit/35 bg-sunlit/10 p-4 text-xs leading-relaxed text-regolith-bright">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-sunlit uppercase">
              <ShieldCheck className="h-4 w-4" />
              <span>Primary Planetary Visualization Attribution</span>
            </div>
            <p className="mt-1">
              Lunar globe color imagery and laser elevation data courtesy of{" "}
              <strong>
                NASA&apos;s Scientific Visualization Studio — CGI Moon Kit (Ernie
                Wright, Noah Petro, LRO WAC &amp; LOLA Science Teams, GSFC)
              </strong>
              . Martian globe topography and Viking color mosaic courtesy of{" "}
              <strong>
                NASA GSFC / USGS Astrogeology (MGS MOLA MEGDR &amp; Viking MDIM 2.1)
              </strong>{" "}
              and <strong>MRO HiRISE (JPL-Caltech / University of Arizona)</strong>.
              Anthropogenic hardware coordinates verified against{" "}
              <strong>Wagner et al. (2017, Icarus 283)</strong> and the{" "}
              <strong>NASA Space Science Data Coordinated Archive (NSSDCA)</strong>.
            </p>
          </div>

          {PORTAL_ORDER.map((portal) => {
            const entries = grouped.get(portal) ?? [];
            if (entries.length === 0) return null;

            return (
              <section key={portal} className="space-y-2.5">
                <h3 className="font-mono text-xs font-bold tracking-wider text-loro uppercase">
                  {PORTAL_LABELS[portal]}
                </h3>

                <div className="space-y-2.5">
                  {entries.map((entry) => {
                    const isHighlighted = entry.id === highlightedSourceId;
                    const linkedSites = sitesBySourceId.get(entry.id) ?? [];

                    return (
                      <div
                        key={entry.id}
                        ref={(el) => {
                          cardRefs.current[entry.id] = el;
                        }}
                        className={`rounded-2xl border p-3.5 transition-colors ${
                          isHighlighted
                            ? "border-loro bg-loro/12 shadow-[0_0_25px_rgba(92,225,255,0.25)]"
                            : "border-white/10 bg-space-900/75"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sunlit">
                              {entry.id}
                            </span>
                            <h4 className="mt-1 font-display text-sm font-bold text-regolith-bright">
                              {entry.title}
                            </h4>
                            <p className="text-xs text-regolith/75">
                              {entry.agencyOrAuthor}
                            </p>
                          </div>

                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-loro/40 bg-loro/10 px-3 py-1 font-mono text-[11px] font-medium text-loro transition hover:bg-loro/25"
                          >
                            <span>Open NASA Archive</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        <p className="mt-2 font-mono text-[11px] text-regolith/70">
                          Credit: {entry.creditLine}
                        </p>

                        {linkedSites.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-regolith/55">
                              Sites:
                            </span>
                            {linkedSites.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  const targetBody = getSiteBody(s.id);
                                  setCelestialBody(targetBody);
                                  if (mode !== "explore") enterExplore(true);
                                  selectSite(s.id, "story");
                                  closeSources();
                                  void cameraBus.flyToLatLon(s.lat, s.lon);
                                }}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/15 bg-space-950/75 px-2 py-0.5 font-mono text-[10px] text-regolith-bright hover:border-loro hover:text-loro"
                              >
                                <MapPin className="h-2.5 w-2.5 text-loro" />
                                <span>{s.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-space-900/90 px-6 py-3 text-center font-mono text-[11px] text-regolith/65">
          Created for the 2026 NASA International Space Apps Challenge (&ldquo;NASA&apos;s
          Discarded Equipment Storytelling&rdquo;). Uses public-domain NASA imagery
          and data; does not imply official NASA endorsement.
        </div>
      </div>
    </div>
  );
}
