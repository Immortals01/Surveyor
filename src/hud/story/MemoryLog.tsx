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
  const settings = useAppStore((s) => s.settings);
  const openSources = useAppStore((s) => s.openSources);

  const handleTogglePlay = async () => {
    audioEngine.unlock(settings.muted);
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
    <div className="telemetry-scanlines rounded-2xl border border-sunlit/40 bg-space-950/90 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sunlit">
          <Radio className="h-3.5 w-3.5" />
          <span className="font-mono text-[10.5px] font-semibold tracking-wider uppercase">
            {memoryLog.speakerLabel ?? "FIRST-PERSON MEMORY LOG"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleTogglePlay()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-sunlit/45 bg-sunlit/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-sunlit transition hover:bg-sunlit/25 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
        >
          {playing ? (
            <>
              <Square className="h-2.5 w-2.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="h-2.5 w-2.5 fill-current" />
              <span>Hear Memory</span>
            </>
          )}
        </button>
      </div>

      <blockquote className="mt-2.5 text-[14.5px] leading-relaxed text-amber-100/95 italic">
        &ldquo;{memoryLog.text}&rdquo;
      </blockquote>

      {memoryLog.sourceIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {memoryLog.sourceIds.map((sid) => (
            <button
              key={sid}
              type="button"
              onClick={() => openSources(sid)}
              className="cursor-pointer font-mono text-[10px] text-regolith/65 underline decoration-dotted hover:text-loro"
            >
              [{sid}]
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
