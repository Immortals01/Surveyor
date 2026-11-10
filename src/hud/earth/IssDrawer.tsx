import { Compass, ExternalLink, Radio, X } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cameraBus } from "@/engine/camera";
import { formatLatLon, normalizeLon } from "@/lib/geo";
import {
  getLatestIssTelemetry,
  ISS_INCLINATION_DEG,
  useIssTracker,
} from "@/lib/issTracker";
import { useAppStore } from "@/store/useAppStore";

export default function IssDrawer() {
  const issPanelOpen = useAppStore((s) => s.issPanelOpen);
  const setIssPanelOpen = useAppStore((s) => s.setIssPanelOpen);
  const openSources = useAppStore((s) => s.openSources);
  const setSunDirection = useAppStore((s) => s.setSunDirection);

  const telemetry = useIssTracker(issPanelOpen);

  if (!issPanelOpen) return null;

  const handleClose = () => {
    audioEngine.playUiTick(660);
    setIssPanelOpen(false);
    void cameraBus.goHome();
  };

  const handleCenterOnIss = () => {
    audioEngine.playUiTick(880);
    const live = getLatestIssTelemetry();
    setSunDirection(normalizeLon(live.lon - 15), 12);
    void cameraBus.flyToLatLon(live.lat, live.lon, { altitude: 0.44 });
  };

  return (
    <aside
      aria-label="International Space Station Live Orbital Telemetry"
      className="animate-hud-fade-up pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[65dvh] flex-col overflow-hidden border-t border-white/20 bg-space-950/95 shadow-[0_-24px_70px_rgba(0,0,0,0.92)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[420px] lg:border"
    >
      {/* Architectural Corner Telemetry Brackets */}
      <span className="pointer-events-none absolute -top-px -left-px z-20 h-3 w-3 border-t-2 border-l-2 border-loro" />
      <span className="pointer-events-none absolute -top-px -right-px z-20 h-3 w-3 border-t-2 border-r-2 border-loro" />
      <span className="pointer-events-none absolute -bottom-px -left-px z-20 h-3 w-3 border-b-2 border-l-2 border-loro" />
      <span className="pointer-events-none absolute -right-px -bottom-px z-20 h-3 w-3 border-r-2 border-b-2 border-loro" />

      {/* Mobile Drag Handle */}
      <div className="mx-auto mt-2 h-0.5 w-10 shrink-0 bg-white/25 lg:hidden" />

      {/* Sticky Editorial & Telemetry Header */}
      <div className="shrink-0 border-b border-white/15 bg-space-950/90 px-5 pt-3.5 pb-3.5 lg:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] font-bold tracking-[0.15em] text-sunlit uppercase">
            <span>1998</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] text-regolith uppercase transition hover:border-regolith-bright hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close ISS telemetry drawer"
            title="Close Dossier (Esc)"
          >
            <span className="hidden sm:inline">ESC</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h2 className="mt-2 font-display text-[20px] leading-[1.15] font-bold tracking-tight text-regolith-bright">
          International Space Station
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-regolith/75">
          Humanity&apos;s permanent orbital laboratory circling Earth every 92.9 minutes
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="hud-scroll flex-1 space-y-4 overflow-y-auto p-5">
        {/* Live Telemetry Readout Ledger */}
        <div className="telemetry-scanlines border border-white/15 border-l-2 border-l-loro bg-space-900/60 p-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-loro uppercase">
              <Radio className="h-3.5 w-3.5" />
              <span>LIVE ORBITAL TELEMETRY</span>
            </span>
            <button
              type="button"
              onClick={handleCenterOnIss}
              className="inline-flex cursor-pointer items-center gap-1.5 border border-loro/50 bg-loro/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-loro uppercase transition hover:border-loro hover:bg-loro/20 hover:text-white"
            >
              <Compass className="h-3 w-3" />
              <span>Track Orbit</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 border-t border-l border-white/15 bg-space-950/90">
            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                01 POSITION
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-regolith-bright">
                {formatLatLon(telemetry.lat, telemetry.lon)}
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                02 ALTITUDE
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-sunlit">
                {telemetry.altitudeKm.toFixed(1)} km
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                03 VELOCITY
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-loro">
                {Math.round(telemetry.velocityKmh).toLocaleString()} km/h
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                04 ILLUMINATION
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-regolith-bright uppercase">
                {telemetry.visibility} · {ISS_INCLINATION_DEG}°
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
            01 // MISSION OVERVIEW
          </div>
          <p className="font-body text-[14px] leading-[1.65] text-regolith-bright/95">
            Assembled in low-Earth orbit across <strong>42+ launches</strong>{" "}
            beginning in 1998, the International Space Station has hosted{" "}
            <strong>280+ astronauts</strong> from 23 nations continuously since
            November 2000.
          </p>
        </div>

        {/* NASA Citation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/55 uppercase">
            SOURCES
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => openSources("S-BLUE-MARBLE")}
              className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro transition hover:border-loro hover:bg-loro/15 hover:text-white"
            >
              <span>S-BLUE-MARBLE</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
