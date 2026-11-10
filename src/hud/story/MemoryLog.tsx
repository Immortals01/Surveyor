import { useState } from "react";
import { Play, Radio, Square } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { cancelSpeech, speakLine } from "@/audio/speech";
import type { DialogueLine } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";

interface MemoryLogProps {
  memoryLog: DialogueLine;
}

export default function MemoryLog({ memoryLog }: MemoryLogProps) {
  const [playing, setPlaying] = useState(false);
  const openSources = useAppStore((s) => s.openSources);

  const handleTogglePlay = async () => {
    audioEngine.unlock(useAppStore.getState().settings.muted);
    if (playing) {
      cancelSpeech();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    useAppStore.getState().setLoRoMood("nostalgic");
    try {
      await speakLine(memoryLog);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <div className="telemetry-scanlines relative border border-white/15 border-l-2 border-l-sunlit bg-space-900/60 p-4">
      {/* Subtle architectural top-right corner bracket */}
      <span className="pointer-events-none absolute -top-px -right-px h-2.5 w-2.5 border-t border-r border-sunlit/60" />

      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sunlit">
          <Radio className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono text-[10px] font-bold tracking-[0.14em] uppercase">
            {memoryLog.speakerLabel ?? "FIRST-PERSON HARDWARE LOG"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleTogglePlay()}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none ${
            playing
              ? "border-sunlit bg-sunlit text-space-950"
              : "border-sunlit/50 bg-sunlit/10 text-sunlit hover:border-sunlit hover:bg-sunlit/20"
          }`}
        >
          {playing ? (
            <>
              <Square className="h-2.5 w-2.5 fill-current" />
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>Voice Log</span>
            </>
          )}
        </button>
      </div>

      <blockquote className="mt-3 font-body text-[14px] leading-[1.65] text-regolith-bright/95 italic">
        &ldquo;{memoryLog.text}&rdquo;
      </blockquote>

      {memoryLog.sourceIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-2 font-mono text-[9.5px] tracking-wider text-regolith/50 uppercase">
          <span>TRANSCRIPT SOURCE</span>
          <div className="flex flex-wrap gap-1.5">
            {memoryLog.sourceIds.map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() => openSources(sid)}
                className="cursor-pointer text-regolith/75 underline decoration-white/30 underline-offset-2 transition hover:text-loro hover:decoration-loro"
              >
                [{sid}]
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
