import { Component, type ReactNode } from "react";
import { getSitesForBody } from "@/data";
import { getCategoryMeta } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

export function Fallback2DMoonMap() {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectSite = useAppStore((s) => s.selectSite);
  const enterExplore = useAppStore((s) => s.enterExplore);
  const mode = useAppStore((s) => s.mode);
  const sites = getSitesForBody(celestialBody);
  const categoryMeta = getCategoryMeta(celestialBody);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-space-950 p-6">
      <div className="relative aspect-[2/1] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-space-900 shadow-2xl">
        <img
          src={
            celestialBody === "earth"
              ? "/textures/earth/earth_day_2k.webp"
              : celestialBody === "mars"
                ? "/textures/mars/color/L0/0_0.webp"
                : "/textures/moon/moon_day_2k.webp"
          }
          alt={
            celestialBody === "earth"
              ? "NASA Blue Marble Global Earth Map"
              : celestialBody === "mars"
                ? "NASA MGS MOLA & Viking Global Mars Map"
                : "NASA LRO WAC Global Lunar Map"
          }
          className="h-full w-full object-cover opacity-80"
        />
        {sites.map((site) => {
          const xPct = ((site.lon + 180) / 360) * 100;
          const yPct = ((90 - site.lat) / 180) * 100;
          const cat = categoryMeta[site.primaryCategory];
          const isSelected = site.id === selectedSiteId;

          return (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                if (mode === "intro") enterExplore(true);
                selectSite(site.id);
              }}
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition hover:scale-125 ${
                isSelected ? "z-20 ring-4 ring-loro" : "z-10"
              }`}
              title={`${site.name} (${site.year})`}
            >
              <span
                className={`block rounded-full border border-space-950 ${
                  site.tier === "hero" ? "h-4 w-4" : "h-2.5 w-2.5"
                }`}
                style={{ backgroundColor: cat.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SceneErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <Fallback2DMoonMap />;
    }
    return this.props.children;
  }
}
