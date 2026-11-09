import { useEffect, useState } from "react";
import { Radio, Satellite, Volume2, VolumeX } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech } from "@/audio/speech";
import { useAppStore } from "@/store/useAppStore";

interface DialogueBoxProps {
  onAdvanceTour?: () => void;
}

export default function DialogueBox({ onAdvanceTour }: DialogueBoxProps) {
  const dialogue = useAppStore((s) => s.dialogue);
  const mode = useAppStore((s) => s.mode);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const patchDialogue = useAppStore((s) => s.patchDialogue);
  const setDialogue = useAppStore((s) => s.setDialogue);
  const openSources = useAppStore((s) => s.openSources);

  const [revealState, setRevealState] = useState<{
    lineId: string;
    count: number;
  }>({ lineId: "", count: 0 });

  const fullText = dialogue?.text ?? "";
  const lineId = dialogue?.lineId ?? "";
  const isRevealing = Boolean(dialogue?.isRevealing);

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

  if (!dialogue || !settings.captionsEnabled) return null;

  const charCount = revealState.lineId === lineId ? revealState.count : 0;
  const isEquipment = dialogue.speaker === "equipment";
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
    } else if (mode === "explore") {
      cancelSpeech();
      setDialogue(null);
    }
  };

  const toggleMute = () => {
    const nextMuted = !settings.muted;
    audioEngine.unlock(nextMuted);
    audioEngine.setMuted(nextMuted);
    updateSettings({ muted: nextMuted });
  };

  return (
    <div
      className={`pointer-events-auto relative w-full max-w-xl border p-4 shadow-2xl backdrop-blur-xl transition-colors ${
        isEquipment
          ? "telemetry-scanlines border-sunlit/45 bg-space-950/92"
          : "border-white/20 bg-space-950/90"
      }`}
    >
      {/* Screen-reader polite full-line announcement (fires once per line, never per character) */}
      <span className="sr-only" aria-live="polite">
        {dialogue.speakerLabel}: {fullText}
      </span>

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isEquipment ? (
            <Radio className="h-3.5 w-3.5 text-sunlit" />
          ) : (
            <Satellite className="h-3.5 w-3.5 text-loro" />
          )}
          <span
            className={`font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase ${
              isEquipment ? "text-sunlit" : "text-loro"
            }`}
          >
            {dialogue.speakerLabel}
          </span>
          {dialogue.isSpeaking && (
            <span className="inline-flex items-center gap-0.5" aria-hidden="true">
              <span className="h-2 w-0.5 animate-pulse bg-current opacity-80" />
              <span className="h-3 w-0.5 animate-pulse bg-current" />
              <span className="h-1.5 w-0.5 animate-pulse bg-current opacity-70" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {dialogue.sourceIds.slice(0, 2).map((sid) => (
            <button
              key={sid}
              type="button"
              onClick={() => openSources(sid)}
              className="border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-regolith/80 transition hover:border-loro hover:text-loro focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              title={`Inspect NASA citation ${sid}`}
            >
              {sid}
            </button>
          ))}

          <button
            type="button"
            onClick={toggleMute}
            className="border border-white/15 bg-white/5 p-1 text-regolith/80 transition hover:border-loro/50 hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
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
        className={`cursor-pointer text-[14.5px] leading-relaxed ${
          isEquipment ? "text-amber-100/95 italic" : "text-regolith-bright"
        }`}
      >
        {isEquipment ? `“${shownText}${isRevealing ? "" : "”"}` : shownText}
        {isRevealing && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-loro align-middle" />
        )}
      </p>

      <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10.5px] text-regolith/60">
        <span>
          {dialogue.holdForInteraction
            ? "INTERACTIVE EXPERIMENT READY"
            : isRevealing
              ? "CLICK TO REVEAL ALL"
              : mode === "tour"
                ? "AUTO-ADVANCING · OR CLICK CONTINUE"
                : "CLICK TO DISMISS"}
        </span>

        <button
          type="button"
          onClick={handlePrimaryClick}
          className={`px-3 py-1 font-mono text-[11px] font-semibold uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
            dialogue.holdForInteraction
              ? "bg-regolith-bright text-space-950 hover:bg-white"
              : "border border-white/20 bg-white/8 text-regolith-bright hover:border-loro hover:text-white"
          }`}
        >
          {isRevealing
            ? "Reveal"
            : mode === "tour"
              ? "Continue →"
              : "Close"}
        </button>
      </div>
    </div>
  );
}
