import { useMemo } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  History,
  MapPin,
  X,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech } from "@/audio/speech";
import { getSiteBody, getSitesForBody, SITE_BY_ID } from "@/data";
import { cameraBus } from "@/engine/camera";
import { getCategoryMeta } from "@/lib/constants";
import { formatLatLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import MemoryLog from "./MemoryLog";
import StatsGrid from "./StatsGrid";

export default function SiteDrawer() {
  const activeBody = useAppStore((s) => s.activeBody);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectSite = useAppStore((s) => s.selectSite);
  const openSources = useAppStore((s) => s.openSources);

  const site = selectedSiteId ? SITE_BY_ID.get(selectedSiteId) : undefined;
  const bodySites = getSitesForBody(activeBody);
  const relatedSecondary = useMemo(
    () =>
      site
        ? bodySites.filter(
            (s) => s.tier === "secondary" && s.parentHeroId === site.id,
          )
        : [],
    [bodySites, site],
  );

  if (!site) return null;

  const siteBody = getSiteBody(site.id);
  const isMars = siteBody === "mars";
  const isEarth = siteBody === "earth";
  const categoryMeta = getCategoryMeta(siteBody);
  const cat = categoryMeta[site.primaryCategory];

  const parentHero =
    site.tier === "secondary" && site.parentHeroId
      ? SITE_BY_ID.get(site.parentHeroId)
      : undefined;

  const handleClose = () => {
    audioEngine.playUiTick(660);
    cancelSpeech();
    const state = useAppStore.getState();
    state.setDialogue(null);
    if (state.mode === "tour") {
      state.enterExplore(false);
    } else {
      selectSite(null);
    }
    void cameraBus.goHome();
  };

  const bodyCornerColor = isMars
    ? "border-orange-400"
    : isEarth
      ? "border-loro"
      : "border-sunlit";

  return (
    <aside
      aria-label={`${isMars ? "Martian artifact" : isEarth ? "Earth space site" : "Lunar artifact"} dossier: ${site.name}`}
      className="animate-hud-fade-up pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[65dvh] flex-col overflow-hidden border-t border-white/20 bg-space-950/95 shadow-[0_-24px_70px_rgba(0,0,0,0.92)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[452px] lg:border"
    >
      {/* Architectural Corner Telemetry Brackets */}
      <span
        className={`pointer-events-none absolute -top-px -left-px z-20 h-3 w-3 border-t-2 border-l-2 ${bodyCornerColor}`}
      />
      <span
        className={`pointer-events-none absolute -top-px -right-px z-20 h-3 w-3 border-t-2 border-r-2 ${bodyCornerColor}`}
      />
      <span
        className={`pointer-events-none absolute -bottom-px -left-px z-20 h-3 w-3 border-b-2 border-l-2 ${bodyCornerColor}`}
      />
      <span
        className={`pointer-events-none absolute -right-px -bottom-px z-20 h-3 w-3 border-r-2 border-b-2 ${bodyCornerColor}`}
      />

      {/* Mobile Drag Handle Indicator */}
      <div className="mx-auto mt-2 h-0.5 w-10 shrink-0 bg-white/25 lg:hidden" />

      {/* Sticky Editorial & Telemetry Header */}
      <div className="shrink-0 border-b border-white/15 bg-space-950/90 px-5 pt-3.5 pb-0 lg:pt-4">
        {/* Top Archival Classification & Close Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-regolith/70 uppercase">
            <span
              className="h-2 w-2 shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="truncate font-bold text-regolith-bright">
              {cat.shortLabel}
            </span>
            <span className="text-white/25">/</span>
            <span className="truncate">{site.nssdcaId}</span>
            <span className="text-white/25">/</span>
            <span className="text-sunlit">{site.year}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase transition hover:border-regolith-bright hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close site story panel"
            title="Close Dossier (Esc)"
          >
            <span className="hidden sm:inline">ESC</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Editorial Headline & Subtitle */}
        <div className="mt-2.5 pb-3">
          <h2 className="font-display text-[21px] leading-[1.15] font-bold tracking-tight text-regolith-bright">
            {site.name}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-regolith/75">
            {site.subtitle}
          </p>

          {/* Selenographic / Areographic / Geographic Coordinate Strip */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 font-mono text-[10px] tracking-wider text-regolith/65">
            <span className="truncate uppercase">{site.region}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-loro">
              <MapPin className="h-2.5 w-2.5" />
              {formatLatLon(site.lat, site.lon)}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Editorial Body */}
      <div className="hud-scroll flex-1 space-y-5 overflow-y-auto p-5">
        {site.tier === "hero" ? (
          <>
            {/* Archival Photographic Plate */}
            <figure className="border border-white/15 bg-space-950 p-1.5">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-space-900">
                <img
                  src={site.archivePlate.image}
                  alt={site.archivePlate.caption}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
                  ARCHIVE PLATE · {site.archivePlate.year}
                </span>
              </div>
              <figcaption className="mt-1.5 px-1.5 py-1 font-mono text-[10px] leading-relaxed text-regolith/65">
                {site.archivePlate.caption}
              </figcaption>
            </figure>

            {/* First-Person Equipment Memory Log */}
            <MemoryLog memoryLog={site.memoryLog} />

            {/* Narrative Summary */}
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // MISSION OVERVIEW
              </div>
              <p className="font-body text-[14.5px] leading-[1.68] text-regolith-bright/95">
                {site.summary}
              </p>
            </div>

            {/* Verified Telemetry Specs Ledger */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                02 // VERIFIED TELEMETRY &amp; METRICS
              </div>
              <StatsGrid stats={site.stats} />
            </div>

            {/* Hardware Left Behind / Launch Infrastructure Inventory */}
            <div className="border border-white/15 bg-space-900/40">
              <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] font-bold tracking-[0.16em] text-sunlit uppercase">
                <span>
                  03 //{" "}
                  {isEarth
                    ? "KEY LAUNCH & MISSION INFRASTRUCTURE"
                    : isMars
                      ? "HARDWARE REMAINING ON MARS"
                      : "HARDWARE REMAINING ON THE MOON"}
                </span>
                <span className="text-regolith/50">
                  [{site.hardwareLeftBehind.length}]
                </span>
              </div>
              <ul className="divide-y divide-white/10 text-xs text-regolith-bright">
                {site.hardwareLeftBehind.map((item, idx) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 px-3.5 py-2.5 leading-relaxed"
                  >
                    <span className="shrink-0 font-mono text-[10px] text-sunlit/80">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Science Discovery & Path to Artemis / Mars */}
            <div className="divide-y divide-white/15 border border-white/15 bg-space-900/35 text-xs leading-relaxed">
              <div className="p-3.5">
                <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-loro uppercase">
                  04 // SCIENTIFIC LEGACY
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-regolith-bright">
                  {site.scienceImpact}
                </p>
              </div>
              <div className="p-3.5">
                <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-sunlit uppercase">
                  05 //{" "}
                  {isMars
                    ? "PATH TO HUMAN MARS EXPLORATION"
                    : isEarth
                      ? "PATH TO ARTEMIS & DEEP SPACE"
                      : "PATH TO ARTEMIS"}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-regolith/90">
                  {site.artemisLink}
                </p>
              </div>
            </div>

            {/* Related Secondary Artifacts in this Cluster */}
            {relatedSecondary.length > 0 && (
              <div className="border border-white/15 bg-space-900/30 p-3.5">
                <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/60 uppercase">
                  06 //{" "}
                  {isEarth
                    ? `ASSOCIATED SPACE FACILITIES (${relatedSecondary.length})`
                    : isMars
                      ? `ASSOCIATED MARTIAN HARDWARE (${relatedSecondary.length})`
                      : `ASSOCIATED LUNAR HARDWARE (${relatedSecondary.length})`}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {relatedSecondary.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => {
                        selectSite(rel.id);
                        void cameraBus.flyToLatLon(rel.lat, rel.lon);
                      }}
                      className="group inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/90 px-2.5 py-1.5 font-mono text-[10px] text-regolith-bright transition hover:border-loro hover:bg-loro/10 hover:text-loro"
                    >
                      <span>
                        {rel.name} ({rel.year})
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-regolith/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-loro" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Secondary Site Single-Scroll Archival Dossier */
          <>
            <figure className="border border-white/15 bg-space-950 p-1.5">
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-space-900">
                <img
                  src={site.thumbnailImage}
                  alt={site.name}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
                  VERIFIED SITE · {site.year}
                </span>
              </div>
            </figure>

            <div className="space-y-1.5">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // ARCHIVAL SUMMARY
              </div>
              <p className="font-body text-[14.5px] leading-[1.68] text-regolith-bright/95">
                {site.summary}
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                02 // VERIFIED TELEMETRY &amp; METRICS
              </div>
              <StatsGrid stats={site.stats} />
            </div>

            <div className="border border-white/15 bg-space-900/40">
              <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] font-bold tracking-[0.16em] text-sunlit uppercase">
                <span>
                  03 //{" "}
                  {isEarth
                    ? "FACILITY & MISSION INFRASTRUCTURE"
                    : "HARDWARE REMAINING AT SITE"}
                </span>
                <span className="text-regolith/50">
                  [{site.hardwareLeftBehind.length}]
                </span>
              </div>
              <ul className="divide-y divide-white/10 text-xs text-regolith-bright">
                {site.hardwareLeftBehind.map((item, idx) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 px-3.5 py-2.5 leading-relaxed"
                  >
                    <span className="shrink-0 font-mono text-[10px] text-sunlit/80">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {parentHero && (
              <button
                type="button"
                onClick={() => {
                  selectSite(parentHero.id);
                  void cameraBus.flyToLatLon(parentHero.lat, parentHero.lon);
                }}
                className="group flex w-full cursor-pointer items-center justify-between gap-3 border border-regolith-bright bg-regolith-bright px-4 py-3 text-left text-space-950 transition hover:bg-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              >
                <div>
                  <div className="font-mono text-[9.5px] tracking-[0.16em] text-space-950/65 uppercase">
                    PRIMARY EXPEDITION CLUSTER
                  </div>
                  <div className="mt-0.5 font-display text-xs font-bold">
                    Open Featured Dossier: {parentHero.name}
                  </div>
                </div>
                <History className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </>
        )}

        {/* NASA Archive Citation Chips Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3.5">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/55 uppercase">
            NASA ARCHIVE CITATIONS
          </span>
          <div className="flex flex-wrap gap-1.5">
            {site.sourceIds.map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() => openSources(sid)}
                className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro transition hover:border-loro hover:bg-loro/15 hover:text-white"
              >
                <span>{sid}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
