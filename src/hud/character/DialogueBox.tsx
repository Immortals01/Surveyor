import { useEffect, useState } from "react";
import { Radio, Satellite, Volume2, VolumeX } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { SITE_BY_ID } from "@/data";
import { useAppStore } from "@/store/useAppStore";

interface DialogueBoxProps {
  onAdvanceTour?: () => void;
}

const DEFAULT_MOON_MESSAGE =
  "Click any glowing marker on the Moon—or open 'Index (29)' above—to swoop down and hear what our left-behind spacecraft remember!";

const DEFAULT_EARTH_MESSAGE =
  "Click any spaceport or tracking station on Earth—or click 'ISS LIVE' in orbit—to see how many missions started at each site while the Moon gleams in the background!";

const DEFAULT_MARS_MESSAGE =
  "Click any glowing marker on Mars—or open 'Index (29)' above—to swoop down to Viking, Pathfinder, Opportunity, Curiosity, Perseverance, and Ingenuity!";

export default function DialogueBox({
  onAdvanceTour,
}: DialogueBoxProps) {
  const activeBody = useAppStore((s) => s.activeBody);
  const dialogue = useAppStore((s) => s.dialogue);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const mode = useAppStore((s) => s.mode);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const patchDialogue = useAppStore((s) => s.patchDialogue);

  const [revealState, setRevealState] = useState<{
    lineId: string;
    count: number;
  }>({ lineId: "", count: 0 });

  // Derive fallback host commentary when no explicit dialogue is active in Explore mode
  const selectedSite = selectedSiteId ? SITE_BY_ID.get(selectedSiteId) : undefined;
  const defaultMsg =
    activeBody === "earth"
      ? DEFAULT_EARTH_MESSAGE
      : activeBody === "mars"
        ? DEFAULT_MARS_MESSAGE
        : DEFAULT_MOON_MESSAGE;
  const fallbackText = selectedSite
    ? selectedSite.tier === "hero"
      ? selectedSite.loroIntro.text
      : `${selectedSite.name} (${selectedSite.year}) — ${selectedSite.summary}`
    : defaultMsg;

  const fullText = dialogue?.text ?? fallbackText;
  const lineId = dialogue?.lineId ?? `fallback-${selectedSiteId ?? "home"}`;
  const isRevealing = Boolean(dialogue?.isRevealing);
  const isEquipment = dialogue?.speaker === "equipment";
  const speakerLabel =
    dialogue?.speakerLabel ??
    (selectedSite
      ? `SURVEYOR 3 · ON ${selectedSite.mission.toUpperCase()}`
      : "SURVEYOR 3 (1967)");

  useEffect(() => {
    if (!dialogue || !dialogue.isRevealing || settings.reduceMotion) {
      return;
    }

    const activeLineId = dialogue.lineId;
    const targetLen = dialogue.text.length;
    const interval = window.setInterval(() => {
      setRevealState((prev) => {
        const base = prev.lineId === activeLineId ? prev.count : 0;
        const next = base + 2;
        if (next >= targetLen) {
          window.clearInterval(interval);
          patchDialogue({ isRevealing: false });
          return { lineId: activeLineId, count: targetLen };
        }
        return { lineId: activeLineId, count: next };
      });
    }, 34);

    return () => window.clearInterval(interval);
  }, [lineId, isRevealing, settings.reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings.captionsEnabled) return null;

  const charCount = revealState.lineId === lineId ? revealState.count : 0;
  const shownText =
    isRevealing && !settings.reduceMotion
      ? fullText.slice(0, charCount)
      : fullText;

  const handlePrimaryClick = () => {
    audioEngine.playUiTick(960);
    if (isRevealing) {
      setRevealState({ lineId, count: fullText.length });
      patchDialogue({ isRevealing: false });
      return;
    }
    if (mode === "tour" && onAdvanceTour) {
      onAdvanceTour();
    }
  };

  const toggleMute = () => {
    const nextMuted = !settings.muted;
    audioEngine.unlock(nextMuted);
    audioEngine.setMuted(nextMuted);
    updateSettings({ muted: nextMuted });
  };

  const accentStroke = isEquipment ? "#ffcf70" : "#5ce1ff";

  return (
    <div className="pointer-events-auto relative flex w-full flex-col items-start">
      {/* ================================================================== */}
      {/* SPEECH CALLOUT BOX (Shown above Surveyor 3)                        */}
      {/* ================================================================== */}
      <div
        className={`relative w-full max-w-xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors sm:p-5 ${
          isEquipment
            ? "telemetry-scanlines border-sunlit/60 bg-space-950/94"
            : "border-loro/55 bg-space-950/94"
        }`}
      >
        {/* Corner accent brackets */}
        <span
          className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2"
          style={{ borderColor: accentStroke }}
        />
        <span
          className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2"
          style={{ borderColor: accentStroke }}
        />
        <span
          className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2"
          style={{ borderColor: accentStroke }}
        />
        <span
          className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2"
          style={{ borderColor: accentStroke }}
        />

        {/* Screen-reader polite full-line announcement */}
        <span className="sr-only" aria-live="polite">
          {speakerLabel}: {fullText}
        </span>

        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isEquipment ? (
              <Radio className="h-4 w-4 text-sunlit" />
            ) : (
              <Satellite className="h-4 w-4 text-loro" />
            )}
            <span
              className={`font-mono text-[11px] font-bold tracking-[0.14em] uppercase ${
                isEquipment ? "text-sunlit" : "text-loro"
              }`}
            >
              {speakerLabel}
            </span>
            {dialogue?.isSpeaking && (
              <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                <span className="h-2.5 w-0.5 animate-pulse bg-current opacity-80" />
                <span className="h-3.5 w-0.5 animate-pulse bg-current" />
                <span className="h-2 w-0.5 animate-pulse bg-current opacity-70" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="cursor-pointer border border-white/15 bg-white/5 p-1 text-regolith/80 transition hover:border-loro/50 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              aria-label={settings.muted ? "Unmute audio" : "Mute audio"}
              title={settings.muted ? "Unmute audio" : "Mute audio"}
            >
              {settings.muted ? (
                <VolumeX className="h-3.5 w-3.5 text-alert" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-loro" />
              )}
            </button>
          </div>
        </div>

        <p
          onClick={handlePrimaryClick}
          className={`cursor-pointer text-[15px] leading-relaxed sm:text-[15.5px] ${
            isEquipment ? "text-amber-100/95 italic" : "text-regolith-bright"
          }`}
        >
          {isEquipment ? `“${shownText}${isRevealing ? "" : "”"}` : `“${shownText}${isRevealing ? "" : "”"}`}
          {isRevealing && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-loro align-middle" />
          )}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono text-[10.5px] text-regolith/65">
          <span>
            {dialogue?.holdForInteraction
              ? "INTERACTIVE EXPERIMENT READY"
              : isRevealing
                ? "CLICK TO REVEAL ALL"
                : mode === "tour"
                  ? "AUTO-ADVANCING · OR CLICK CONTINUE"
                  : "SURVEYOR 3 LIVE TELEMETRY LINK"}
          </span>

          {(isRevealing || mode === "tour") && (
            <button
              type="button"
              onClick={handlePrimaryClick}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-semibold uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
                dialogue?.holdForInteraction
                  ? "bg-regolith-bright text-space-950 hover:bg-white"
                  : "border border-loro/40 bg-loro/10 text-regolith-bright hover:border-loro hover:bg-loro/20 hover:text-white"
              }`}
            >
              {isRevealing ? <span>Reveal</span> : <span>Continue →</span>}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* CALLOUT ARROW CONNECTOR (Emerging upward from Surveyor 3 -> Text)  */}
      {/* ================================================================== */}
      <div
        className="pointer-events-none relative -mt-px flex h-11 w-full items-center pl-16 sm:pl-20"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 44"
          className="h-11 w-16 overflow-visible"
          fill="none"
        >
          {/* Speech bubble triangular tail welded to the bottom box border */}
          <polygon
            points="22,0 42,0 32,11"
            fill="#05070d"
            fillOpacity="0.94"
          />
          <polyline
            points="22,0 32,11 42,0"
            stroke={accentStroke}
            strokeOpacity="0.65"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Vertical telemetry leader line emerging from Surveyor 3 upward */}
          <path
            d="M 32 36 L 32 14"
            stroke={accentStroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Crisp directional arrowhead pointing up into speech bubble */}
          <polygon
            points="32,12 26.5,21 32,19 37.5,21"
            fill={accentStroke}
          />

          {/* Glowing origin node at Surveyor 3's top mast */}
          <circle
            cx="32"
            cy="39"
            r="4"
            fill={accentStroke}
            fillOpacity="0.25"
            stroke={accentStroke}
            strokeWidth="1.5"
          />
          <circle cx="32" cy="39" r="1.8" fill={accentStroke} />
        </svg>
      </div>
    </div>
  );
}
