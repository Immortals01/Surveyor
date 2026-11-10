import { Suspense, lazy, useMemo } from "react";
import {
  Box,
  BookOpen,
  ExternalLink,
  FlaskConical,
  History,
  Layers,
  Rocket,
  Wrench,
  X,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech } from "@/audio/speech";
import { getSiteBody, getSitesForBody, SITE_BY_ID } from "@/data";
import type { StoryTab } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import LaserRetroreflector from "@/hud/interactions/LaserRetroreflector";
import MarsHelicopterFlight from "@/hud/interactions/MarsHelicopterFlight";
import Marsquake from "@/hud/interactions/Marsquake";
import Moonquake from "@/hud/interactions/Moonquake";
import MoxieOxygenGenerator from "@/hud/interactions/MoxieOxygenGenerator";
import RoverLiftoffCam from "@/hud/interactions/RoverLiftoffCam";
import { useAppStore } from "@/store/useAppStore";
import MemoryLog from "./MemoryLog";
import StatsGrid from "./StatsGrid";
import ThenNowSlider from "./ThenNowSlider";

const ModelSpotlight = lazy(() => import("./ModelSpotlight"));

export default function SiteDrawer() {
  const activeBody = useAppStore((s) => s.activeBody);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const activeStoryTab = useAppStore((s) => s.activeStoryTab);
  const setActiveStoryTab = useAppStore((s) => s.setActiveStoryTab);
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
  const parentHero =
    site.tier === "secondary" && site.parentHeroId
      ? SITE_BY_ID.get(site.parentHeroId)
      : undefined;

  const hasWidget = site.tier === "hero" && Boolean(site.widget);
  const hasModel = site.tier === "hero" && Boolean(site.model3d);

  // Ensure active tab is valid for this hero site
  let effectiveTab: StoryTab = activeStoryTab;
  if (site.tier === "hero") {
    if (effectiveTab === "science" && !hasWidget) effectiveTab = "story";
    if (effectiveTab === "model" && !hasModel) effectiveTab = "story";
  }

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

  return (
    <aside
      aria-label={`${isMars ? "Martian artifact" : isEarth ? "Earth space site" : "Lunar artifact"} dossier: ${site.name}`}
      className="pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[62dvh] flex-col overflow-hidden rounded-t-3xl border-t border-loro/35 bg-space-950/92 shadow-[0_-18px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[440px] lg:rounded-3xl lg:border"
    >
      {/* Mobile Drag Handle Indicator */}
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />

      {/* Sticky Header */}
      <div className="shrink-0 border-b border-white/10 px-5 pt-3 pb-3.5 lg:pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl leading-snug font-bold text-regolith-bright">
              {site.name}
            </h2>
            <p className="mt-0.5 text-xs text-regolith/80">{site.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/5 p-1.5 text-regolith transition hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close site story panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Multi-Tab Bar (Story / Then vs Now / Interactive Lab / 3D Model) */}
        {site.tier === "hero" && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                setActiveStoryTab("story");
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase transition ${
                effectiveTab === "story"
                  ? "border-loro bg-loro/20 text-white"
                  : "border-white/10 bg-white/5 text-regolith/75 hover:border-white/30 hover:text-white"
              }`}
            >
              <BookOpen className="h-3 w-3 text-loro" />
              <span>Story</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiTick();
                setActiveStoryTab("then-now");
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase transition ${
                effectiveTab === "then-now"
                  ? "border-loro bg-loro/20 text-white"
                  : "border-white/10 bg-white/5 text-regolith/75 hover:border-white/30 hover:text-white"
              }`}
            >
              <Layers className="h-3 w-3 text-sunlit" />
              <span>Then vs Now</span>
            </button>

            {hasWidget && (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiTick();
                  setActiveStoryTab("science");
                }}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase transition ${
                  effectiveTab === "science"
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-200"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400"
                }`}
              >
                <FlaskConical className="h-3 w-3" />
                <span>Interactive Lab</span>
              </button>
            )}

            {hasModel && (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiTick();
                  setActiveStoryTab("model");
                }}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase transition ${
                  effectiveTab === "model"
                    ? "border-sunlit bg-sunlit/20 text-sunlit"
                    : "border-white/10 bg-white/5 text-regolith/75 hover:border-white/30 hover:text-white"
                }`}
              >
                <Box className="h-3 w-3 text-sunlit" />
                <span>3D Model</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="hud-scroll flex-1 space-y-4 overflow-y-auto p-5">
        {site.tier === "hero" ? (
          <>
            {effectiveTab === "story" && (
              <>
                {/* Historical "Then" Surface Archive Image at Top of Story */}
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-space-900/75">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-space-900">
                    <img
                      src={site.thenNow.thenImage}
                      alt={site.thenNow.thenCaption}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full border border-sunlit/40 bg-space-950/85 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sunlit backdrop-blur-md">
                      {site.thenNow.thenYear}
                    </span>
                  </div>
                </div>

                {/* First-Person Equipment Memory Log */}
                <MemoryLog memoryLog={site.memoryLog} />

                {/* Narrative Summary */}
                <p className="text-[14.5px] leading-relaxed text-regolith/95">
                  {site.summary}
                </p>

                {/* Verified Stats Grid */}
                <StatsGrid stats={site.stats} />

                {/* Hardware Left Behind / Launch Infrastructure Inventory */}
                <div className="rounded-2xl border border-white/10 bg-space-900/65 p-3.5">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sunlit uppercase">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>
                      {isEarth
                        ? "Key Launch & Mission Infrastructure"
                        : isMars
                          ? "Hardware Left on Mars"
                          : "Hardware Left on the Moon"}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-regolith-bright">
                    {site.hardwareLeftBehind.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunlit" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Science Discovery & Path to Artemis / Mars */}
                <div className="space-y-2.5 rounded-2xl border border-loro/25 bg-loro/5 p-3.5 text-xs leading-relaxed">
                  <div>
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-loro uppercase">
                      <FlaskConical className="h-3 w-3" /> Why It Matters for Science
                    </span>
                    <p className="mt-0.5 text-regolith-bright">
                      {site.scienceImpact}
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-sunlit uppercase">
                      <Rocket className="h-3 w-3" />{" "}
                      {isMars
                        ? "Path to Human Mars Exploration"
                        : isEarth
                          ? "Path to Artemis & Deep Space"
                          : "Path to Artemis"}
                    </span>
                    <p className="mt-0.5 text-regolith/90">{site.artemisLink}</p>
                  </div>
                </div>

                {/* Related Secondary Artifacts in this Cluster */}
                {relatedSecondary.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-space-900/50 p-3.5">
                    <p className="font-mono text-[10.5px] font-semibold tracking-wider text-regolith/70 uppercase">
                      {isEarth
                        ? `Related Space Facilities (${relatedSecondary.length})`
                        : isMars
                          ? `Related Martian Hardware (${relatedSecondary.length})`
                          : `Related Lunar Hardware (${relatedSecondary.length})`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {relatedSecondary.map((rel) => (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => {
                            selectSite(rel.id, "story");
                            void cameraBus.flyToLatLon(rel.lat, rel.lon);
                          }}
                          className="cursor-pointer rounded-full border border-white/15 bg-space-950/80 px-2.5 py-1 font-mono text-[10.5px] text-regolith-bright transition hover:border-loro hover:text-loro"
                        >
                          {rel.name} ({rel.year})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {effectiveTab === "then-now" && (
              <ThenNowSlider thenNow={site.thenNow} />
            )}

            {effectiveTab === "science" && (
              <div className="space-y-4">
                {site.widget === "laser-retroreflector" && (
                  <LaserRetroreflector />
                )}
                {site.widget === "moonquake" && <Moonquake />}
                {site.widget === "rover-liftoff-cam" && <RoverLiftoffCam />}
                {site.widget === "mars-helicopter-flight" && (
                  <MarsHelicopterFlight />
                )}
                {site.widget === "marsquake" && <Marsquake />}
                {site.widget === "moxie-oxygen" && <MoxieOxygenGenerator />}
              </div>
            )}

            {effectiveTab === "model" && site.model3d && (
              <Suspense
                fallback={
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-white/10 bg-space-900 font-mono text-xs text-loro">
                    Loading 3D spacecraft model...
                  </div>
                }
              >
                <ModelSpotlight
                  model3d={site.model3d}
                  fallbackImage={site.thenNow.thenImage}
                />
              </Suspense>
            )}
          </>
        ) : (
          /* Secondary Site Single-Scroll Dossier */
          <>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/15 bg-space-900">
              <img
                src={site.thumbnailImage}
                alt={site.name}
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-full border border-sunlit/40 bg-space-950/85 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sunlit backdrop-blur-md">
                {site.year}
              </span>
            </div>

            <p className="text-[14.5px] leading-relaxed text-regolith/95">
              {site.summary}
            </p>

            <StatsGrid stats={site.stats} />

            <div className="rounded-2xl border border-white/10 bg-space-900/65 p-3.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sunlit uppercase">
                <Wrench className="h-3.5 w-3.5" />
                <span>Hardware Left Behind</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-regolith-bright">
                {site.hardwareLeftBehind.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunlit" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {parentHero && (
              <button
                type="button"
                onClick={() => {
                  selectSite(parentHero.id, "story");
                  void cameraBus.flyToLatLon(parentHero.lat, parentHero.lon);
                }}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sunlit/40 bg-sunlit/10 px-4 py-2.5 font-mono text-xs font-semibold text-sunlit transition hover:bg-sunlit/20"
              >
                <History className="h-4 w-4" />
                <span>Explore Featured Hero Story: {parentHero.name}</span>
              </button>
            )}
          </>
        )}

        {/* NASA Archive Citation Chips Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="font-mono text-[10px] text-regolith/60 uppercase">
            Verified NASA Open Data Sources
          </span>
          <div className="flex flex-wrap gap-1.5">
            {site.sourceIds.map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() => openSources(sid)}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro transition hover:border-loro hover:bg-loro/15"
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
