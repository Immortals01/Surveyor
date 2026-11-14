import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech } from "@/audio/speech";
import { getSiteBody, SITE_BY_ID } from "@/data";
import { getMachineForSite } from "@/data/machines";
import MachineDossier from "@/hud/machines/MachineDossier";
import { cameraBus } from "@/engine/camera";
import {
  getSiteImageUrl,
  isSiteImageDecoded,
  markSiteImageDecoded,
  preloadBodySiteImages,
} from "@/lib/siteImagePreloader";
import { useAppStore } from "@/store/useAppStore";
import SiteVideoEmbed from "./SiteVideoEmbed";
import StatsGrid from "./StatsGrid";

export default function SiteDrawer() {
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const selectSite = useAppStore((s) => s.selectSite);
  const openSources = useAppStore((s) => s.openSources);
  const machineAutoplay = useAppStore((s) => s.machineAutoplay);

  // Warm the image cache for the active planet/moon
  useEffect(() => {
    preloadBodySiteImages(celestialBody);
  }, [celestialBody]);

  const site = selectedSiteId ? SITE_BY_ID.get(selectedSiteId) : undefined;
  const imgUrl = site ? getSiteImageUrl(site) : "";
  const [loadedUrl, setLoadedUrl] = useState<string>(imgUrl);

  if (!site) return null;

  const isImgReady = loadedUrl === imgUrl || isSiteImageDecoded(imgUrl);

  const siteBody = getSiteBody(site.id);
  const isMars = siteBody === "mars";
  const machine = getMachineForSite(site.id);

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

  const bodyCornerColor = isMars ? "border-orange-400" : "border-sunlit";

  const videoSection = site.video ? (
    <div className="space-y-2">
      <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
        02 // ARCHIVE FILM
      </div>
      <SiteVideoEmbed video={site.video} />
    </div>
  ) : null;

  const metricsStep = site.video ? "03" : "02";

  return (
    <aside
      aria-label={`${isMars ? "Martian artifact" : "Lunar artifact"} dossier: ${site.name}`}
      className="animate-hud-fade-up pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[65dvh] flex-col overflow-hidden border-t border-white/20 bg-space-950/95 shadow-[0_-24px_70px_rgba(0,0,0,0.92)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[420px] lg:border"
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
      <div className="shrink-0 border-b border-white/15 bg-space-950/90 px-5 pt-3.5 pb-3.5 lg:pt-4">
        {/* Top Year & Close Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] font-bold tracking-[0.15em] text-sunlit uppercase">
            <span>{site.year}</span>
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
        <div className="mt-2">
          <h2 className="font-display text-[20px] leading-[1.15] font-bold tracking-tight text-regolith-bright">
            {site.name}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-regolith/75">
            {site.subtitle}
          </p>
        </div>
      </div>

      {/* Scrollable Editorial Body */}
      <div className="hud-scroll flex-1 space-y-4 overflow-y-auto p-5">
        {machine && (
          <div className="border-b border-white/15 pb-4">
            <MachineDossier machineId={machine.id} embedded autoPlay={machineAutoplay} />
          </div>
        )}

        {site.tier === "hero" ? (
          <>
            {/* Archival Photographic Plate */}
            <figure className="border border-white/15 bg-space-950 p-1.5">
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-space-900">
                <img
                  key={site.id}
                  src={imgUrl}
                  alt={site.archivePlate.caption}
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => {
                    markSiteImageDecoded(imgUrl);
                    setLoadedUrl(imgUrl);
                  }}
                  className={`h-full w-full object-cover transition-opacity duration-150 ${
                    isImgReady ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
                  {site.archivePlate.year}
                </span>
              </div>
            </figure>

            {/* Narrative Summary */}
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // MISSION OVERVIEW
              </div>
              <p className="font-body text-[14px] leading-[1.65] text-regolith-bright/95">
                {site.summary}
              </p>
            </div>

            {/* Archive film hosted on the cited NASA source page */}
            {videoSection}

            {/* Verified Telemetry Specs Ledger */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                {metricsStep} // KEY METRICS
              </div>
              <StatsGrid stats={site.stats} />
            </div>
          </>
        ) : (
          /* Secondary Site Concise Archival Dossier */
          <>
            <figure className="border border-white/15 bg-space-950 p-1.5">
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-space-900">
                <img
                  key={site.id}
                  src={imgUrl}
                  alt={site.name}
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => {
                    markSiteImageDecoded(imgUrl);
                    setLoadedUrl(imgUrl);
                  }}
                  className={`h-full w-full object-cover transition-opacity duration-150 ${
                    isImgReady ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
                  {site.year}
                </span>
              </div>
            </figure>

            <div className="space-y-1.5">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                01 // MISSION OVERVIEW
              </div>
              <p className="font-body text-[14px] leading-[1.65] text-regolith-bright/95">
                {site.summary}
              </p>
            </div>

            {videoSection}

            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
                {metricsStep} // KEY METRICS
              </div>
              <StatsGrid stats={site.stats} />
            </div>
          </>
        )}

        {/* NASA Archive Citation Chips Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/55 uppercase">
            SOURCES
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
