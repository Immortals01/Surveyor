import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  Radio,
  X,
} from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cameraBus } from "@/engine/camera";
import { formatLatLon, normalizeLon } from "@/lib/geo";
import {
  getLatestIssTelemetry,
  ISS_INCLINATION_DEG,
  ISS_NORAD_ID,
  useIssTracker,
} from "@/lib/issTracker";
import { useAppStore } from "@/store/useAppStore";

export default function IssDrawer() {
  const issPanelOpen = useAppStore((s) => s.issPanelOpen);
  const setIssPanelOpen = useAppStore((s) => s.setIssPanelOpen);
  const selectSite = useAppStore((s) => s.selectSite);
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

  const handleJumpToLaunchSite = (siteId: string, lat: number, lon: number) => {
    audioEngine.playUiTick();
    setIssPanelOpen(false);
    setSunDirection(normalizeLon(lon - 18), 12);
    selectSite(siteId, "story");
    void cameraBus.flyToLatLon(lat, lon);
  };

  const hardwareItems = [
    "109-meter Integrated Truss Structure & 8 Roll-Out Solar Arrays (iROSA / SAW)",
    "US Destiny Lab, ESA Columbus Lab, JAXA Kibo Exposed Facility & 7-window Cupola",
    "Zarya FGB, Zvezda Service Module, Nauka Lab & Canadarm2 robotic manipulator",
  ];

  return (
    <aside
      aria-label="International Space Station Live Orbital Telemetry"
      className="animate-hud-fade-up pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[65dvh] flex-col overflow-hidden border-t border-white/20 bg-space-950/95 shadow-[0_-24px_70px_rgba(0,0,0,0.92)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[452px] lg:border"
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
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] font-bold tracking-[0.15em] text-loro uppercase">
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse bg-loro" />
            <span className="truncate">
              NORAD #{ISS_NORAD_ID} //{" "}
              {telemetry.source === "live"
                ? "LIVE EPHEMERIS"
                : "KEPLERIAN PROPAGATION"}
            </span>
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

        <h2 className="mt-2.5 font-display text-[21px] leading-[1.15] font-bold tracking-tight text-regolith-bright">
          International Space Station
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-regolith/75">
          Humanity&apos;s permanent orbital laboratory circling Earth every 92.9 minutes
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="hud-scroll flex-1 space-y-5 overflow-y-auto p-5">
        {/* Live Telemetry Readout Ledger */}
        <div className="telemetry-scanlines border border-white/15 border-l-2 border-l-loro bg-space-900/60 p-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-loro uppercase">
              <Radio className="h-3.5 w-3.5" />
              <span>REAL-TIME ORBITAL STATE VECTOR</span>
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
                01 SUB-SATELLITE POINT
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-regolith-bright">
                {formatLatLon(telemetry.lat, telemetry.lon)}
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                02 ORBITAL ALTITUDE
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-sunlit">
                {telemetry.altitudeKm.toFixed(1)} km
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                03 ORBITAL VELOCITY
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-loro">
                {Math.round(telemetry.velocityKmh).toLocaleString()} km/h
              </p>
            </div>

            <div className="border-r border-b border-white/15 p-3">
              <div className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/60 uppercase">
                04 SOLAR ILLUMINATION
              </div>
              <p className="mt-1.5 font-mono text-xs font-bold text-regolith-bright uppercase">
                {telemetry.visibility} · {ISS_INCLINATION_DEG}° INC
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
            01 // MISSION OVERVIEW
          </div>
          <p className="font-body text-[14.5px] leading-[1.68] text-regolith-bright/95">
            Assembled in low-Earth orbit across <strong>42+ assembly launches</strong>{" "}
            beginning with the Zarya module from Baikonur in November 1998 and the
            Unity node from Kennedy Space Center two weeks later, the International
            Space Station has hosted <strong>280+ astronauts and cosmonauts</strong>{" "}
            from 23 nations continuously since November 2000.
          </p>
        </div>

        {/* Key Specs Grid */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/55 uppercase">
            02 // VERIFIED STATION METRICS
          </div>
          <div className="grid grid-cols-2 border-t border-l border-white/15 bg-space-950/90">
            <div className="border-r border-b border-white/15 p-3.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-regolith/60 uppercase">
                <span className="text-regolith/35">01 </span>TOTAL FLIGHTS
              </span>
              <p className="mt-2 font-display text-[15px] font-bold text-regolith-bright">
                295+ crew &amp; cargo
              </p>
            </div>
            <div className="border-r border-b border-white/15 p-3.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-regolith/60 uppercase">
                <span className="text-regolith/35">02 </span>MASS &amp; SPAN
              </span>
              <p className="mt-2 font-display text-[15px] font-bold text-regolith-bright">
                450,000 kg · 109 m
              </p>
            </div>
            <div className="border-r border-b border-white/15 p-3.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-regolith/60 uppercase">
                <span className="text-regolith/35">03 </span>ORBITAL DAYLIGHT
              </span>
              <p className="mt-2 font-display text-[15px] font-bold text-regolith-bright">
                16 sunrises / 24h
              </p>
            </div>
            <div className="border-r border-b border-white/15 p-3.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-regolith/60 uppercase">
                <span className="text-regolith/35">04 </span>HORIZON FOOTPRINT
              </span>
              <p className="mt-2 font-display text-[15px] font-bold text-regolith-bright">
                {Math.round(telemetry.footprintKm).toLocaleString()} km diameter
              </p>
            </div>
          </div>
        </div>

        {/* Orbital Hardware Inventory */}
        <div className="border border-white/15 bg-space-900/40">
          <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] font-bold tracking-[0.16em] text-sunlit uppercase">
            <span>03 // MAJOR ORBITAL HARDWARE MODULES</span>
            <span className="text-regolith/50">[{hardwareItems.length}]</span>
          </div>
          <ul className="divide-y divide-white/10 text-xs text-regolith-bright">
            {hardwareItems.map((item, idx) => (
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

        {/* Science & Artemis Gateway Connection */}
        <div className="divide-y divide-white/15 border border-white/15 bg-space-900/35 text-xs leading-relaxed">
          <div className="p-3.5">
            <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-loro uppercase">
              04 // MICROGRAVITY &amp; EARTH SCIENCE
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-regolith-bright">
              Over 3,700 experiments conducted in microgravity—testing closed-loop
              water recycling (98% recovery), protein crystal growth, and cosmic-ray
              physics with the Alpha Magnetic Spectrometer (AMS-02).
            </p>
          </div>
          <div className="p-3.5">
            <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-sunlit uppercase">
              05 // PROVING GROUND FOR ARTEMIS &amp; GATEWAY
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-regolith/90">
              Every life-support system, docking standard (IDSS), and deep-space
              spacesuit architecture for NASA&apos;s lunar Gateway station was
              proven aboard the ISS first.
            </p>
          </div>
        </div>

        {/* Connected Earth Spaceports */}
        <div className="border border-white/15 bg-space-900/30 p-3.5">
          <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-regolith/60 uppercase">
            06 // ASSOCIATED LAUNCH &amp; CONTROL COMPLEXES
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("kennedy-lc39", 28.6084, -80.6043)
              }
              className="group inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/90 px-2.5 py-1.5 font-mono text-[10px] text-regolith-bright transition hover:border-loro hover:bg-loro/10 hover:text-loro"
            >
              <span>Kennedy LC-39 (Shuttle &amp; Crew Dragon)</span>
              <ArrowUpRight className="h-3 w-3 text-regolith/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-loro" />
            </button>
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("baikonur-gagarin", 45.92, 63.342)
              }
              className="group inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/90 px-2.5 py-1.5 font-mono text-[10px] text-regolith-bright transition hover:border-loro hover:bg-loro/10 hover:text-loro"
            >
              <span>Baikonur Site 1/5 (Zarya &amp; Soyuz)</span>
              <ArrowUpRight className="h-3 w-3 text-regolith/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-loro" />
            </button>
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("houston-jsc-mcc", 29.5593, -95.09)
              }
              className="group inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-space-950/90 px-2.5 py-1.5 font-mono text-[10px] text-regolith-bright transition hover:border-loro hover:bg-loro/10 hover:text-loro"
            >
              <span>Houston Mission Control (MCC-H)</span>
              <ArrowUpRight className="h-3 w-3 text-regolith/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-loro" />
            </button>
          </div>
        </div>

        {/* NASA Citation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3.5">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-regolith/55 uppercase">
            NASA ARCHIVE CITATIONS
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
