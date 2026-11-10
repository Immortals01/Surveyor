import {
  Compass,
  ExternalLink,
  FlaskConical,
  Gauge,
  Globe2,
  Orbit,
  Radio,
  Rocket,
  Sun,
  Wrench,
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

  return (
    <aside
      aria-label="International Space Station Live Orbital Telemetry"
      className="pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[64dvh] flex-col overflow-hidden rounded-t-3xl border-t border-loro/45 bg-space-950/94 shadow-[0_-18px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:max-h-[calc(100dvh-6.25rem)] lg:w-[440px] lg:rounded-3xl lg:border"
    >
      {/* Mobile Drag Handle */}
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />

      {/* Sticky Header */}
      <div className="shrink-0 border-b border-white/10 px-5 pt-3 pb-3.5 lg:pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold tracking-wider text-loro uppercase">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>
                NORAD #{ISS_NORAD_ID} ·{" "}
                {telemetry.source === "live"
                  ? "LIVE ORBITAL TELEMETRY"
                  : "KEPLERIAN ORBITAL PROPAGATION"}
              </span>
            </div>
            <h2 className="mt-0.5 font-display text-xl leading-snug font-bold text-regolith-bright">
              International Space Station
            </h2>
            <p className="mt-0.5 text-xs text-regolith/80">
              Humanity&apos;s permanent orbital laboratory circling Earth every 92.9 minutes
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/5 p-1.5 text-regolith transition hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label="Close ISS telemetry drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="hud-scroll flex-1 space-y-4 overflow-y-auto p-5">
        {/* Live Telemetry Readout Card */}
        <div className="telemetry-scanlines rounded-2xl border border-loro/40 bg-space-900/85 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-loro uppercase">
              <Radio className="h-3.5 w-3.5" />
              <span>Real-Time Orbital State Vector</span>
            </span>
            <button
              type="button"
              onClick={handleCenterOnIss}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-loro/50 bg-loro/15 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-loro transition hover:bg-loro/25 hover:text-white"
            >
              <Compass className="h-3 w-3" />
              <span>Center on ISS</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-space-950/85 p-2.5">
              <div className="flex items-center gap-1 font-mono text-[10px] text-regolith/65 uppercase">
                <Globe2 className="h-3 w-3 text-loro" />
                <span>Sub-Satellite Point</span>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-regolith-bright">
                {formatLatLon(telemetry.lat, telemetry.lon)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-space-950/85 p-2.5">
              <div className="flex items-center gap-1 font-mono text-[10px] text-regolith/65 uppercase">
                <Orbit className="h-3 w-3 text-sunlit" />
                <span>Orbital Altitude</span>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-sunlit">
                {telemetry.altitudeKm.toFixed(1)} km
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-space-950/85 p-2.5">
              <div className="flex items-center gap-1 font-mono text-[10px] text-regolith/65 uppercase">
                <Gauge className="h-3 w-3 text-emerald-400" />
                <span>Orbital Velocity</span>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-300">
                {Math.round(telemetry.velocityKmh).toLocaleString()} km/h
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-space-950/85 p-2.5">
              <div className="flex items-center gap-1 font-mono text-[10px] text-regolith/65 uppercase">
                <Sun className="h-3 w-3 text-amber-300" />
                <span>Solar Illumination</span>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-regolith-bright capitalize">
                {telemetry.visibility} · {ISS_INCLINATION_DEG}° inc
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Summary */}
        <p className="text-[14.5px] leading-relaxed text-regolith/95">
          Assembled in low-Earth orbit across <strong>42+ assembly launches</strong>{" "}
          beginning with the Zarya module from Baikonur in November 1998 and the
          Unity node from Kennedy Space Center two weeks later, the International
          Space Station has hosted <strong>280+ astronauts and cosmonauts</strong>{" "}
          from 23 nations continuously since November 2000.
        </p>

        {/* Key Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-white/10 bg-space-900/75 p-3">
            <span className="font-mono text-[10.5px] text-regolith/65 uppercase">
              Total Spaceflights to ISS
            </span>
            <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
              295+ crew &amp; cargo missions
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-space-900/75 p-3">
            <span className="font-mono text-[10.5px] text-regolith/65 uppercase">
              Pressurized Mass &amp; Span
            </span>
            <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
              450,000 kg · 109 m wingspan
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-space-900/75 p-3">
            <span className="font-mono text-[10.5px] text-regolith/65 uppercase">
              Sunrises Per Day
            </span>
            <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
              16 orbital sunrises / 24h
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-space-900/75 p-3">
            <span className="font-mono text-[10.5px] text-regolith/65 uppercase">
              Horizon Footprint
            </span>
            <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
              {Math.round(telemetry.footprintKm).toLocaleString()} km diameter
            </p>
          </div>
        </div>

        {/* Orbital Hardware Inventory */}
        <div className="rounded-2xl border border-white/10 bg-space-900/65 p-3.5">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sunlit uppercase">
            <Wrench className="h-3.5 w-3.5" />
            <span>Major Orbital Hardware Modules</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-regolith-bright">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunlit" />
              <span>
                109-meter Integrated Truss Structure &amp; 8 Roll-Out Solar Arrays (iROSA / SAW)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunlit" />
              <span>
                US Destiny Lab, ESA Columbus Lab, JAXA Kibo Exposed Facility &amp; 7-window Cupola
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunlit" />
              <span>
                Zarya FGB, Zvezda Service Module, Nauka Lab &amp; Canadarm2 robotic manipulator
              </span>
            </li>
          </ul>
        </div>

        {/* Science & Artemis Gateway Connection */}
        <div className="space-y-2.5 rounded-2xl border border-loro/25 bg-loro/5 p-3.5 text-xs leading-relaxed">
          <div>
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-loro uppercase">
              <FlaskConical className="h-3 w-3" /> Microgravity &amp; Earth Science
            </span>
            <p className="mt-0.5 text-regolith-bright">
              Over 3,700 experiments conducted in microgravity—testing closed-loop
              water recycling (98% recovery), protein crystal growth, and cosmic-ray
              physics with the Alpha Magnetic Spectrometer (AMS-02).
            </p>
          </div>
          <div className="border-t border-white/10 pt-2">
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-sunlit uppercase">
              <Rocket className="h-3 w-3" /> Proving Ground for Artemis &amp; Gateway
            </span>
            <p className="mt-0.5 text-regolith/90">
              Every life-support system, docking standard (IDSS), and deep-space
              spacesuit architecture for NASA&apos;s lunar Gateway station was
              proven aboard the ISS first.
            </p>
          </div>
        </div>

        {/* Connected Earth Spaceports */}
        <div className="rounded-2xl border border-white/10 bg-space-900/50 p-3.5">
          <p className="font-mono text-[10.5px] font-semibold tracking-wider text-regolith/70 uppercase">
            Jump to ISS Launch &amp; Control Sites on Earth
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("kennedy-lc39", 28.6084, -80.6043)
              }
              className="cursor-pointer rounded-full border border-white/15 bg-space-950/80 px-2.5 py-1 font-mono text-[10.5px] text-regolith-bright transition hover:border-loro hover:text-loro"
            >
              Kennedy LC-39 (Shuttle &amp; Crew Dragon)
            </button>
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("baikonur-gagarin", 45.92, 63.342)
              }
              className="cursor-pointer rounded-full border border-white/15 bg-space-950/80 px-2.5 py-1 font-mono text-[10.5px] text-regolith-bright transition hover:border-loro hover:text-loro"
            >
              Baikonur Site 1/5 (Zarya &amp; Soyuz)
            </button>
            <button
              type="button"
              onClick={() =>
                handleJumpToLaunchSite("houston-jsc-mcc", 29.5593, -95.09)
              }
              className="cursor-pointer rounded-full border border-white/15 bg-space-950/80 px-2.5 py-1 font-mono text-[10.5px] text-regolith-bright transition hover:border-loro hover:text-loro"
            >
              Houston Mission Control (MCC-H)
            </button>
          </div>
        </div>

        {/* NASA Citation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="font-mono text-[10px] text-regolith/60 uppercase">
            Live Orbital Ephemeris &amp; NASA Sources
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => openSources("S-BLUE-MARBLE")}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro transition hover:border-loro hover:bg-loro/15"
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
